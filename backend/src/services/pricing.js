import { badRequest, round2 } from '../utils/http.js'
import { addDaysUTC, isoOf, nightsOf, parseISODate, todayIn } from '../utils/dates.js'

/**
 * Validate stay dates & guests against booking rules. Throws 400 on violation.
 * Pure — unit tested in test/pricing.test.js.
 */
export function validateStay({ checkIn, checkOut, adults, children, accommodation, booking }) {
  const ci = parseISODate(checkIn)
  const co = parseISODate(checkOut)
  if (!ci || !co) throw badRequest('Please select valid check-in and check-out dates.')
  const today = todayIn(booking.timezone)
  if (checkIn < today) throw badRequest('Check-in cannot be in the past.')
  if (checkOut <= checkIn) throw badRequest('Check-out must be after check-in.')
  const maxDate = isoOf(addDaysUTC(parseISODate(today), Number(booking.maxAdvanceDays) || 365))
  if (checkIn > maxDate) throw badRequest(`Bookings open up to ${booking.maxAdvanceDays} days in advance.`)
  const nights = nightsOf(checkIn, checkOut).length
  if (nights < (Number(booking.minNights) || 1)) throw badRequest(`Minimum stay is ${booking.minNights} night(s).`)
  if (nights > (Number(booking.maxNights) || 30)) throw badRequest(`Maximum stay is ${booking.maxNights} nights.`)
  if (adults < 1) throw badRequest('At least one adult is required.')
  if (adults + children > Number(accommodation.capacity || 0)) throw badRequest(`${accommodation.name} hosts up to ${accommodation.capacity} guests.`)
  return nights
}

/** Fri & Sat nights use weekendPrice when set. */
export const isWeekendNight = (iso) => {
  const day = parseISODate(iso).getUTCDay()
  return day === 5 || day === 6
}

/**
 * Full price breakdown from TRUSTED data only (accommodation doc + admin settings).
 * Prices submitted by clients are never used.
 */
export function computePricing({ accommodation, checkIn, checkOut, adults, children, serviceIds = [], booking, tax }) {
  const nightsList = nightsOf(checkIn, checkOut)
  const nights = nightsList.length
  const base = Number(accommodation.pricePerNight) || 0
  const weekend = Number(accommodation.weekendPrice) || 0
  const nightly = nightsList.map((date) => ({ date, price: weekend > 0 && isWeekendNight(date) ? weekend : base }))
  const baseAmount = round2(nightly.reduce((t, n) => t + n.price, 0))
  const guests = adults + children

  const catalog = Array.isArray(booking.services) ? booking.services : []
  const servicesBreakdown = [...new Set(serviceIds)].map((id) => {
    const s = catalog.find((x) => x.id === id)
    if (!s) throw badRequest('One of the selected services is no longer available.')
    const price = Number(s.price) || 0
    const qty = { per_booking: 1, per_night: nights, per_guest: guests, per_guest_night: guests * nights }[s.unit] ?? 1
    return { id: s.id, name: s.name, unit: s.unit || 'per_booking', price, qty, amount: round2(price * qty) }
  })
  const servicesAmount = round2(servicesBreakdown.reduce((t, s) => t + s.amount, 0))
  const subtotal = round2(baseAmount + servicesAmount)
  const serviceChargePercent = Number(tax.serviceChargePercent) || 0
  const serviceCharge = round2((subtotal * serviceChargePercent) / 100)
  const cleaningFee = round2(Number(tax.cleaningFee) || 0)
  const taxPercent = Number(tax.taxPercent) || 0
  const taxAmount = round2(((subtotal + serviceCharge + cleaningFee) * taxPercent) / 100)
  const totalAmount = round2(subtotal + serviceCharge + cleaningFee + taxAmount)
  const advancePercent = Math.min(100, Math.max(0, Number(booking.advancePaymentPercent) || 0))
  const advanceAmount = advancePercent > 0 && advancePercent < 100 ? round2((totalAmount * advancePercent) / 100) : totalAmount

  return {
    currency: booking.currency || 'INR',
    nights, nightly, baseAmount, servicesBreakdown, servicesAmount, subtotal,
    serviceChargePercent, serviceCharge, cleaningFee,
    taxLabel: tax.taxLabel || 'Tax', taxPercent, taxAmount,
    totalAmount, advancePercent, advanceAmount,
  }
}

/** Derive payment status from totals. */
export function derivePaymentStatus({ totalAmount, amountPaid = 0, amountRefunded = 0, refundPending = false }) {
  if (refundPending) return 'refund_pending'
  if (amountRefunded > 0) return amountRefunded >= amountPaid ? 'refunded' : 'partially_refunded'
  if (amountPaid <= 0) return 'unpaid'
  return amountPaid + 0.009 >= totalAmount ? 'paid' : 'partially_paid'
}
