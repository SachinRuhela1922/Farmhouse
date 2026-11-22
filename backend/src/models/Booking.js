import mongoose from 'mongoose'
import { cleanJSON } from './plugins.js'

const { Schema } = mongoose

const historySchema = new Schema({ status: String, at: { type: Date, default: Date.now }, by: String, note: String }, { _id: false })

const bookingSchema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    accommodation: { type: Schema.Types.ObjectId, ref: 'Accommodation', required: true, index: true },
    accommodationName: String,
    checkIn: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkOut: { type: String, required: true, index: true },
    nights: Number,
    adults: Number,
    children: Number,
    guests: Number,
    services: [String],
    specialRequests: { type: String, default: '' },
    pricing: { type: Schema.Types.Mixed, required: true }, // server-computed breakdown
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountRefunded: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'partially_paid', 'paid', 'refund_pending', 'refunded', 'partially_refunded'], default: 'unpaid', index: true },
    bookingStatus: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending', index: true },
    statusHistory: [historySchema],
    adminNote: String,
    cancellationRequested: { type: Boolean, default: false },
    cancellationReason: String,
    cancelledBy: String,
    lastPaymentAt: Date,
  },
  { timestamps: true },
)
cleanJSON(bookingSchema)

/**
 * One document per booked night. The UNIQUE (accommodation, date) index is what makes
 * double booking impossible — even under concurrent requests.
 */
const nightLockSchema = new Schema({
  accommodation: { type: Schema.Types.ObjectId, ref: 'Accommodation', required: true },
  date: { type: String, required: true },
  bookingId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
})
nightLockSchema.index({ accommodation: 1, date: 1 }, { unique: true })

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    bookingId: { type: String, required: true, index: true },
    gatewayPaymentId: { type: String, unique: true, sparse: true }, // idempotency key for Razorpay
    gatewayOrderId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: String,
    mode: { type: String, enum: ['advance', 'full', 'offline'] },
    status: { type: String, default: 'captured' },
    amountRefunded: { type: Number, default: 0 },
    refunds: [{ refundId: String, amount: Number, status: String, at: { type: Date, default: Date.now }, _id: false }],
    reference: String,
    recordedBy: String,
    source: String,
  },
  { timestamps: true },
)
cleanJSON(paymentSchema)

const paymentOrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookingId: String,
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mode: String,
    amount: Number,
    currency: String,
    status: { type: String, default: 'created' },
    paymentId: String,
  },
  { timestamps: true },
)

/** Outbox of every email we attempt — honest record of what was / wasn't delivered. */
const emailLogSchema = new Schema(
  { to: [String], subject: String, status: { type: String, enum: ['sent', 'failed', 'not_configured'] }, error: String },
  { timestamps: true },
)

const m = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)
export const Booking = m('Booking', bookingSchema)
export const NightLock = m('NightLock', nightLockSchema)
export const Payment = m('Payment', paymentSchema)
export const PaymentOrder = m('PaymentOrder', paymentOrderSchema)
export const EmailLog = m('EmailLog', emailLogSchema)
