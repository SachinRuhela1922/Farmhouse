import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validate, notFound } from '../utils/http.js'
import { requireAuth } from '../middleware/auth.js'
import { Booking, Payment } from '../models/Booking.js'
import * as bookings from '../services/bookingService.js'
import { quoteSchema, bookingSchema, cancelSchema } from '../validations/schemas.js'

const r = Router()
const quoteLimit = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false })
const createLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many booking attempts. Please try again later.', code: 'resource-exhausted' } } })

/** Public — price & availability are always computed on the server. */
r.post('/quote', quoteLimit, validate(quoteSchema), async (req, res) => res.json(await bookings.getQuote(req.body)))

r.post('/', createLimit, requireAuth, validate(bookingSchema), async (req, res) => {
  const booking = await bookings.createBooking(req.user, req.body)
  res.status(201).json({ bookingId: booking.bookingId, totalAmount: booking.totalAmount, booking })
})

r.get('/mine', requireAuth, async (req, res) => {
  const items = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json({ items: items.map((b) => b.toJSON()) })
})

/** Owner or admin only. */
async function loadOwned(req) {
  const b = await Booking.findOne({ bookingId: req.params.bookingId })
  if (!b || (String(b.user) !== String(req.user._id) && req.user.role !== 'admin')) throw notFound('Booking not found.')
  return b
}

r.get('/:bookingId', requireAuth, async (req, res) => res.json({ booking: (await loadOwned(req)).toJSON() }))

r.get('/:bookingId/payments', requireAuth, async (req, res) => {
  const b = await loadOwned(req)
  const items = await Payment.find({ booking: b._id }).sort({ createdAt: -1 })
  res.json({ items: items.map((p) => p.toJSON()) })
})

r.post('/:bookingId/cancel', requireAuth, validate(cancelSchema), async (req, res) => {
  res.json(await bookings.cancelByGuest(req.user, req.params.bookingId, req.body.reason))
})

export default r
