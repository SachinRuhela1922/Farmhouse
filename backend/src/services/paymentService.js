import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { Booking, Payment, PaymentOrder } from '../models/Booking.js'
import { getSettings } from './settingsService.js'
import { derivePaymentStatus } from './pricing.js'
import { sendEmail, templates } from './emailService.js'
import { razorpay, verifyCheckoutSignature, toPaise, fromPaise } from './razorpay.js'
import { badRequest, forbidden, notFound, precondition, round2 } from '../utils/http.js'

/**
 * Idempotently record a captured payment. `gatewayPaymentId` is UNIQUE, so the browser
 * verification and the webhook can both report the same payment safely.
 */
export async function recordPayment({ bookingId, amount, method, mode, gatewayPaymentId, gatewayOrderId, extra = {} }) {
  const session = await mongoose.startSession()
  let out
  let bookingJson
  try {
    await session.withTransaction(async () => {
      const b = await Booking.findOne({ bookingId }).session(session)
      if (!b) throw notFound('Booking not found.')
      if (gatewayPaymentId && (await Payment.exists({ gatewayPaymentId }).session(session))) {
        out = { duplicate: true, paymentStatus: b.paymentStatus }
        return
      }
      await Payment.create([{ booking: b._id, bookingId, amount, method, mode, gatewayPaymentId, gatewayOrderId, currency: b.pricing?.currency || 'INR', ...extra }], { session })
      b.amountPaid = round2((b.amountPaid || 0) + amount)
      b.paymentStatus = derivePaymentStatus({ totalAmount: b.totalAmount, amountPaid: b.amountPaid, amountRefunded: b.amountRefunded })
      b.lastPaymentAt = new Date()
      await b.save({ session })
      out = { duplicate: false, paymentStatus: b.paymentStatus, amountPaid: b.amountPaid }
      bookingJson = b.toJSON()
    })
  } finally {
    await session.endSession()
  }
  if (bookingJson) {
    const s = await getSettings()
    sendEmail({ ...templates.paymentReceived(s.businessName, bookingJson, amount), to: bookingJson.email })
  }
  return out
}

export async function createOrder(user, bookingId, mode) {
  const b = await Booking.findOne({ bookingId, user: user._id }).lean()
  if (!b) throw notFound('Booking not found.')
  if (b.bookingStatus !== 'confirmed') throw precondition('Payment opens once your booking is confirmed.')
  const due = round2(b.totalAmount - (b.amountPaid || 0))
  if (due <= 0) throw precondition('This booking is already fully paid.')
  let amount = due
  if (mode === 'advance') {
    if ((b.amountPaid || 0) > 0) throw precondition('An advance has already been paid.')
    amount = Math.min(due, b.pricing?.advanceAmount || due)
  }
  const currency = b.pricing?.currency || 'INR'
  const order = await razorpay().createOrder({
    amount: toPaise(amount), currency,
    receipt: `${bookingId}-${Date.now().toString(36)}`.slice(0, 40),
    notes: { bookingId, userId: String(user._id), mode },
  })
  await PaymentOrder.create({ orderId: order.id, booking: b._id, bookingId, user: user._id, mode, amount, currency })
  return { orderId: order.id, amount: order.amount, currency, keyId: env.razorpay.keyId }
}

export async function verifyPayment(user, { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }) {
  if (!env.razorpay.keySecret || !verifyCheckoutSignature({ orderId, paymentId, signature, secret: env.razorpay.keySecret }))
    throw forbidden('Payment verification failed. If money was deducted it will be reconciled automatically.')
  const order = await PaymentOrder.findOne({ orderId })
  if (!order || order.bookingId !== bookingId || String(order.user) !== String(user._id)) throw forbidden('Order mismatch.')
  // Confirm with the gateway that this payment really succeeded for this order and amount
  const p = await razorpay().fetchPayment(paymentId)
  if (p.order_id !== orderId || !['captured', 'authorized'].includes(p.status) || p.amount !== toPaise(order.amount))
    throw precondition(`Payment is ${p.status}. Please try again.`)
  const res = await recordPayment({
    bookingId, amount: fromPaise(p.amount), method: p.method || 'razorpay', mode: order.mode,
    gatewayPaymentId: paymentId, gatewayOrderId: orderId, extra: { status: 'captured', source: 'checkout' },
  })
  order.status = 'paid'
  order.paymentId = paymentId
  await order.save()
  return res
}

export async function handleWebhook(event, payload) {
  if (event === 'payment.captured') {
    const p = payload.payment.entity
    const order = await PaymentOrder.findOne({ orderId: p.order_id })
    if (!order) return
    await recordPayment({
      bookingId: order.bookingId, amount: fromPaise(p.amount), method: p.method || 'razorpay', mode: order.mode,
      gatewayPaymentId: p.id, gatewayOrderId: p.order_id, extra: { status: 'captured', source: 'webhook' },
    })
    order.status = 'paid'
    order.paymentId = p.id
    await order.save()
  } else if (event === 'refund.processed' || event === 'refund.failed') {
    const r = payload.refund.entity
    const pay = await Payment.findOne({ gatewayPaymentId: r.payment_id })
    if (!pay) return
    const ref = pay.refunds.find((x) => x.refundId === r.id)
    if (ref) ref.status = r.status
    await pay.save()
    const b = await Booking.findById(pay.booking)
    if (b) {
      b.paymentStatus = derivePaymentStatus({ totalAmount: b.totalAmount, amountPaid: b.amountPaid, amountRefunded: b.amountRefunded })
      await b.save()
    }
  }
}

export async function refundPayment(admin, { bookingId, paymentId, amount }) {
  const pay = await Payment.findOne({ _id: paymentId, bookingId })
  if (!pay?.gatewayPaymentId) throw notFound('Online payment not found.')
  const refundable = round2(pay.amount - (pay.amountRefunded || 0))
  if (amount > refundable + 0.001) throw badRequest(`Maximum refundable is ${refundable}.`)
  const refund = await razorpay().refund(pay.gatewayPaymentId, toPaise(amount), { bookingId, by: String(admin._id) })
  pay.amountRefunded = round2((pay.amountRefunded || 0) + amount)
  pay.refunds.push({ refundId: refund.id, amount, status: refund.status })
  await pay.save()
  const b = await Booking.findOne({ bookingId })
  b.amountRefunded = round2((b.amountRefunded || 0) + amount)
  b.paymentStatus = derivePaymentStatus({ totalAmount: b.totalAmount, amountPaid: b.amountPaid, amountRefunded: b.amountRefunded, refundPending: refund.status !== 'processed' })
  await b.save()
  return { refundId: refund.id, status: refund.status }
}

export async function recordOffline(admin, { bookingId, amount, method, reference }) {
  const b = await Booking.findOne({ bookingId }).lean()
  if (!b) throw notFound('Booking not found.')
  const due = round2(b.totalAmount - (b.amountPaid || 0))
  if (amount > due + 0.01) throw badRequest(`Amount exceeds the balance due (${due}).`)
  return recordPayment({ bookingId, amount, method, mode: 'offline', extra: { reference, recordedBy: String(admin._id), status: 'captured', source: 'offline' } })
}
