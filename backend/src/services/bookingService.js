import mongoose from 'mongoose'
import { randomInt } from 'node:crypto'
import { Accommodation } from '../models/Content.js'
import { Booking, NightLock } from '../models/Booking.js'
import { getSettings } from './settingsService.js'
import { computePricing, validateStay } from './pricing.js'
import { sendEmail, templates } from './emailService.js'
import { nightsOf, todayIn } from '../utils/dates.js'
import { conflict, notFound, precondition, tooMany } from '../utils/http.js'

export const MAX_PENDING_PER_USER = 3

/** Readable, unguessable booking id, e.g. WM-261121-K7Q2XD */
export function newBookingId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('')
  return `WM-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${rand}`
}

async function loadActiveAccommodation(id, session) {
  if (!mongoose.isValidObjectId(id)) throw notFound('This accommodation is not available for booking.')
  const acc = await Accommodation.findOne({ _id: id, isActive: true }).session(session || null).lean()
  if (!acc) throw notFound('This accommodation is not available for booking.')
  return acc
}

/** Public quote: server-side price + availability. */
export async function getQuote(input) {
  const settings = await getSettings()
  const { bookingSettings: booking, taxSettings: tax } = settings
  const accommodation = await loadActiveAccommodation(input.accommodationId)
  validateStay({ ...input, accommodation, booking })
  const pricing = computePricing({ ...input, serviceIds: input.services, accommodation, booking, tax })
  const nights = nightsOf(input.checkIn, input.checkOut)
  const taken = await NightLock.find({ accommodation: accommodation._id, date: { $in: nights } }).select('date').lean()
  const conflicts = taken.map((t) => t.date).sort()
  return {
    ...pricing,
    available: conflicts.length === 0,
    conflictDates: conflicts,
    reason: conflicts.length ? `already booked on ${conflicts.slice(0, 3).join(', ')}${conflicts.length > 3 ? '…' : ''}` : null,
    accommodation: { id: String(accommodation._id), name: accommodation.name },
  }
}

/**
 * Create a booking atomically.
 * Night locks have a UNIQUE (accommodation, date) index: if any night is already taken —
 * including by a concurrent request — the insert fails with E11000 and the whole
 * transaction rolls back. Double booking is impossible by construction.
 */
export async function createBooking(user, input) {
  const settings = await getSettings()
  const { bookingSettings: bs, taxSettings: tax } = settings
  if (bs.requireVerifiedEmail && !user.emailVerified) throw precondition('Please verify your email address before booking.')
  const pending = await Booking.countDocuments({ user: user._id, bookingStatus: 'pending' })
  if (pending >= MAX_PENDING_PER_USER) throw tooMany(`You already have ${MAX_PENDING_PER_USER} pending requests. Please wait for confirmation or cancel one.`)

  const session = await mongoose.startSession()
  let booking
  try {
    await session.withTransaction(async () => {
      const accommodation = await loadActiveAccommodation(input.accommodationId, session)
      validateStay({ ...input, accommodation, booking: bs })
      const pricing = computePricing({ ...input, serviceIds: input.services, accommodation, booking: bs, tax })
      const bookingId = newBookingId()
      const nights = nightsOf(input.checkIn, input.checkOut)
      try {
        await NightLock.insertMany(nights.map((date) => ({ accommodation: accommodation._id, date, bookingId })), { session, ordered: true })
      } catch (e) {
        if (e?.code === 11000 || e?.writeErrors?.some?.((w) => w.code === 11000))
          throw conflict(`Sorry — ${accommodation.name} is already booked for some of these nights. Please choose other dates.`)
        throw e
      }
      ;[booking] = await Booking.create([{
        bookingId,
        user: user._id,
        guestName: input.guestName,
        email: input.email,
        phone: input.phone,
        specialRequests: input.specialRequests || '',
        accommodation: accommodation._id,
        accommodationName: accommodation.name,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights: pricing.nights,
        adults: input.adults,
        children: input.children,
        guests: input.adults + input.children,
        services: pricing.servicesBreakdown.map((s) => s.id),
        pricing,
        totalAmount: pricing.totalAmount,
        statusHistory: [{ status: 'pending', by: 'guest' }],
      }], { session })
    })
  } finally {
    await session.endSession()
  }

  // Notifications happen after commit and never fail the booking
  const b = booking.toJSON()
  sendEmail({ ...templates.bookingReceived(settings.businessName, b), to: b.email })
  if (settings.contact?.email) sendEmail({ ...templates.adminNewBooking(settings.businessName, b), to: settings.contact.email })
  return b
}

async function releaseNights(bookingId, session) {
  await NightLock.deleteMany({ bookingId }).session(session)
}

/** Guest cancellation: pending → cancelled immediately; confirmed → cancellation request. */
export async function cancelByGuest(user, bookingId, reason = '') {
  const settings = await getSettings()
  const session = await mongoose.startSession()
  let result
  let b
  try {
    await session.withTransaction(async () => {
      const doc = await Booking.findOne({ bookingId, user: user._id }).session(session)
      if (!doc) throw notFound('Booking not found.')
      if (doc.bookingStatus === 'pending') {
        await releaseNights(bookingId, session)
        doc.bookingStatus = 'cancelled'
        doc.cancellationReason = reason
        doc.cancelledBy = 'guest'
        doc.statusHistory.push({ status: 'cancelled', by: 'guest', note: reason })
        await doc.save({ session })
        result = 'cancelled'
      } else if (doc.bookingStatus === 'confirmed') {
        if (!doc.cancellationRequested) {
          doc.cancellationRequested = true
          doc.cancellationReason = reason
          await doc.save({ session })
        }
        result = 'requested'
      } else throw precondition(`A ${doc.bookingStatus} booking cannot be cancelled.`)
      b = doc.toJSON()
    })
  } finally {
    await session.endSession()
  }
  if (result === 'cancelled') sendEmail({ ...templates.statusChanged(settings.businessName, b, 'cancelled'), to: b.email })
  else if (settings.contact?.email) sendEmail({ ...templates.cancellationRequested(settings.businessName, b, reason), to: settings.contact.email })
  return { status: result, booking: b }
}

const TRANSITIONS = { pending: ['confirmed', 'rejected', 'cancelled'], confirmed: ['completed', 'cancelled'], rejected: [], cancelled: [], completed: [] }

/** Admin status transition and/or payment-status override. */
export async function adminUpdate(admin, bookingId, { status, paymentStatus, note = '' }) {
  const settings = await getSettings()
  const session = await mongoose.startSession()
  let b
  let changed = false
  try {
    await session.withTransaction(async () => {
      const doc = await Booking.findOne({ bookingId }).session(session)
      if (!doc) throw notFound('Booking not found.')
      if (status && status !== doc.bookingStatus) {
        if (!TRANSITIONS[doc.bookingStatus]?.includes(status)) throw precondition(`Cannot change a ${doc.bookingStatus} booking to ${status}.`)
        doc.bookingStatus = status
        doc.statusHistory.push({ status, by: String(admin._id), note })
        if (note) doc.adminNote = note
        if (status === 'rejected' || status === 'cancelled') {
          await releaseNights(bookingId, session)
          doc.cancellationRequested = false
          if (status === 'cancelled') doc.cancelledBy = 'admin'
        }
        changed = true
      }
      if (paymentStatus) doc.paymentStatus = paymentStatus
      await doc.save({ session })
      b = doc.toJSON()
    })
  } finally {
    await session.endSession()
  }
  if (changed) sendEmail({ ...templates.statusChanged(settings.businessName, b, status, note), to: b.email })
  return b
}

/** Daily housekeeping: complete finished stays, expire stale pending requests. */
export async function runMaintenance() {
  const { bookingSettings } = await getSettings()
  const today = todayIn(bookingSettings.timezone)
  const completed = await Booking.updateMany(
    { bookingStatus: 'confirmed', checkOut: { $lt: today } },
    { $set: { bookingStatus: 'completed' }, $push: { statusHistory: { status: 'completed', by: 'system', at: new Date() } } },
  )
  const stale = await Booking.find({ bookingStatus: 'pending', checkIn: { $lt: today } }).select('bookingId')
  for (const s of stale) {
    await NightLock.deleteMany({ bookingId: s.bookingId })
    await Booking.updateOne({ _id: s._id, bookingStatus: 'pending' }, {
      $set: { bookingStatus: 'cancelled', cancelledBy: 'system', cancellationReason: 'Request expired before confirmation' },
      $push: { statusHistory: { status: 'cancelled', by: 'system', note: 'Expired', at: new Date() } },
    })
  }
  return { completed: completed.modifiedCount, expired: stale.length }
}
