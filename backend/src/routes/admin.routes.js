import { Router } from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import { validate, notFound, badRequest, escapeRegex } from '../utils/http.js'
import { requireAdmin } from '../middleware/auth.js'
import { Accommodation, Experience, Gallery, Testimonial, Faq, Contact, Newsletter } from '../models/Content.js'
import { Booking, Payment, EmailLog } from '../models/Booking.js'
import { User } from '../models/User.js'
import * as bookings from '../services/bookingService.js'
import * as payments from '../services/paymentService.js'
import { saveSettings, getRawSettings } from '../services/settingsService.js'
import { storeMedia, deleteMedia, mediaIdFromUrl, MAX_VIDEO_BYTES } from '../services/mediaService.js'
import { installStarterContent } from '../services/seedService.js'
import { installDemoData, removeDemoData, demoSummary } from '../services/demoService.js'
import { emailConfigured } from '../services/emailService.js'
import { paymentsConfigured } from '../services/razorpay.js'
import { firebaseAuth } from '../config/firebase.js'
import { nightsOf } from '../utils/dates.js'
import {
  adminBookingUpdateSchema, refundSchema, offlineSchema, contentSchemas, reorderSchema, statusSchema, setAdminSchema, settingsSchema,
} from '../validations/schemas.js'

const r = Router()
r.use(requireAdmin) // every route below requires the admin role (verified from MongoDB per request)

const slugify = (s = '') => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

/* ============================== Dashboard ============================== */
r.get('/stats', async (_req, res) => {
  const [statusAgg, revenueAgg, customers, monthlyAgg, recentBookings, recentContacts, stays, newContacts] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$bookingStatus', n: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { bookingStatus: { $in: ['confirmed', 'completed'] } } }, { $group: { _id: null, paid: { $sum: '$amountPaid' }, refunded: { $sum: '$amountRefunded' } } }]),
    User.countDocuments({ role: 'customer' }),
    Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        bookings: { $sum: { $cond: [{ $ne: ['$bookingStatus', 'rejected'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $in: ['$bookingStatus', ['confirmed', 'completed']] }, { $subtract: ['$amountPaid', '$amountRefunded'] }, 0] } },
      } },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(6),
    Contact.find().sort({ createdAt: -1 }).limit(5),
    Accommodation.find({ isActive: true }).select('name').lean(),
    Contact.countDocuments({ status: 'new' }),
  ])
  const byStatus = Object.fromEntries(statusAgg.map((s) => [s._id, s.n]))

  // Occupancy (current month): booked nights / (active stays × days)
  const now = new Date()
  const first = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10)
  const nextFirst = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)).toISOString().slice(0, 10)
  const days = nightsOf(first, nextFirst)
  const active = await Booking.find({ bookingStatus: { $in: ['pending', 'confirmed', 'completed'] }, checkIn: { $lt: nextFirst }, checkOut: { $gt: first } }).select('accommodation checkIn checkOut').lean()
  const perStay = stays.map((s) => {
    const n = active.filter((b) => String(b.accommodation) === String(s._id)).reduce((t, b) => t + nightsOf(b.checkIn, b.checkOut).filter((d) => d >= first && d < nextFirst).length, 0)
    return { name: s.name, nights: n, pct: Math.round((n / days.length) * 100) }
  })
  const bookedNights = perStay.reduce((t, s) => t + s.nights, 0)

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = monthlyAgg.find((x) => x._id === key)
    return { key, month: d.toLocaleString('en-US', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2), bookings: m?.bookings || 0, revenue: m?.revenue || 0 }
  })

  res.json({
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    byStatus,
    pending: byStatus.pending || 0,
    confirmed: byStatus.confirmed || 0,
    customers,
    revenue: (revenueAgg[0]?.paid || 0) - (revenueAgg[0]?.refunded || 0),
    monthly: months,
    occupancy: { pct: stays.length ? Math.round((bookedNights / (stays.length * days.length)) * 100) : 0, bookedNights, activeStays: stays.length, perStay },
    recentBookings: recentBookings.map((b) => b.toJSON()),
    recentContacts: recentContacts.map((c) => c.toJSON()),
    badges: { pending: byStatus.pending || 0, newContacts },
  })
})

/* ============================== Bookings ============================== */
r.get('/bookings', async (req, res) => {
  const { status, q, from, to } = req.query
  const filter = {}
  if (status === 'cancellation') Object.assign(filter, { bookingStatus: 'confirmed', cancellationRequested: true })
  else if (status && status !== 'all') filter.bookingStatus = String(status)
  if (from || to) filter.checkIn = { ...(from && { $gte: String(from) }), ...(to && { $lte: String(to) }) }
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).slice(0, 80)), 'i')
    filter.$or = [{ bookingId: rx }, { guestName: rx }, { email: rx }, { phone: rx }, { accommodationName: rx }]
  }
  const items = await Booking.find(filter).sort({ createdAt: -1 }).limit(2000)
  res.json({ items: items.map((b) => b.toJSON()) })
})

r.patch('/bookings/:bookingId', validate(adminBookingUpdateSchema), async (req, res) => {
  res.json({ booking: await bookings.adminUpdate(req.user, req.params.bookingId, req.body) })
})

r.post('/bookings/:bookingId/refund', validate(refundSchema), async (req, res) => {
  res.json(await payments.refundPayment(req.user, { bookingId: req.params.bookingId, ...req.body }))
})

r.post('/bookings/:bookingId/offline-payment', validate(offlineSchema), async (req, res) => {
  res.json(await payments.recordOffline(req.user, { bookingId: req.params.bookingId, ...req.body }))
})

/* ============================== Content CRUD ============================== */
const MODELS = { accommodations: Accommodation, experiences: Experience, gallery: Gallery, testimonials: Testimonial, faqs: Faq }
const resolve = (req) => {
  const Model = MODELS[req.params.collection]
  if (!Model) throw notFound('Unknown collection.')
  return Model
}
const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw notFound() }

/** Collect GridFS ids referenced by a content document (to clean up on delete/replace). */
function mediaIdsOf(doc) {
  const urls = [doc.imageUrl, doc.image, ...(doc.images || []).map((i) => i.url)].filter(Boolean)
  return [...new Set([doc.mediaId, ...(doc.images || []).map((i) => i.mediaId), ...urls.map(mediaIdFromUrl)].filter(Boolean))]
}

r.get('/content/:collection', async (req, res) => {
  const items = await resolve(req).find().sort({ displayOrder: 1, createdAt: 1 })
  res.json({ items: items.map((d) => d.toJSON()) })
})

r.post('/content/:collection', async (req, res) => {
  const Model = resolve(req)
  const data = contentSchemas[req.params.collection].parse(req.body)
  if (req.params.collection === 'accommodations') {
    let slug = slugify(data.slug || data.name) || 'stay'
    if (await Accommodation.exists({ slug })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    data.slug = slug
  }
  if (data.displayOrder === 0) data.displayOrder = await Model.countDocuments()
  const doc = await Model.create(data)
  res.status(201).json({ item: doc.toJSON() })
})

r.put('/content/:collection/:id', async (req, res) => {
  const Model = resolve(req)
  ensureId(req.params.id)
  const data = contentSchemas[req.params.collection].parse(req.body)
  const prev = await Model.findById(req.params.id).lean()
  if (!prev) throw notFound()
  if (req.params.collection === 'accommodations') {
    data.slug = prev.slug // keep URLs stable
  }
  const update = { $set: data }
  if (data.mediaId === undefined && prev.mediaId) update.$unset = { mediaId: 1 }
  const doc = await Model.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after', runValidators: true })
  // Remove media no longer referenced
  const keep = new Set(mediaIdsOf(doc.toObject()))
  await Promise.all(mediaIdsOf(prev).filter((id) => !keep.has(id)).map(deleteMedia))
  res.json({ item: doc.toJSON() })
})

/** Partial update — used for publish toggles. Only boolean visibility fields allowed. */
r.patch('/content/:collection/:id', async (req, res) => {
  const Model = resolve(req)
  ensureId(req.params.id)
  const allowed = {}
  for (const k of ['isActive', 'isPublished']) if (typeof req.body?.[k] === 'boolean') allowed[k] = req.body[k]
  for (const k of ['title', 'category']) if (typeof req.body?.[k] === 'string') allowed[k] = req.body[k].trim().slice(0, 100)
  if (!Object.keys(allowed).length) throw badRequest('Nothing to update.')
  const doc = await Model.findByIdAndUpdate(req.params.id, allowed, { returnDocument: 'after', runValidators: true })
  if (!doc) throw notFound()
  res.json({ item: doc.toJSON() })
})

r.delete('/content/:collection/:id', async (req, res) => {
  const Model = resolve(req)
  ensureId(req.params.id)
  if (req.params.collection === 'accommodations' && (await Booking.exists({ accommodation: req.params.id, bookingStatus: { $in: ['pending', 'confirmed'] } })))
    throw badRequest('This stay has active bookings. Deactivate it instead of deleting.')
  const doc = await Model.findByIdAndDelete(req.params.id).lean()
  if (!doc) throw notFound()
  await Promise.all(mediaIdsOf(doc).map(deleteMedia))
  res.json({ ok: true })
})

r.post('/content/:collection/reorder', validate(reorderSchema), async (req, res) => {
  const Model = resolve(req)
  await Model.bulkWrite(req.body.ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { displayOrder: i } } })))
  res.json({ ok: true })
})

/* ============================== Media (GridFS) ============================== */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO_BYTES, files: 1 } })
r.post('/media', upload.single('file'), async (req, res) => {
  const folder = String(req.body?.folder || 'misc').replace(/[^a-z0-9-]/gi, '').slice(0, 30)
  res.status(201).json(await storeMedia(req.file, { folder, uploadedBy: req.user._id }))
})
r.delete('/media/:id', async (req, res) => {
  await deleteMedia(req.params.id)
  res.json({ ok: true })
})

/* ============================== Customers ============================== */
r.get('/customers', async (req, res) => {
  const filter = {}
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 80)), 'i')
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }]
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(2000)
  const stats = await Booking.aggregate([{ $group: { _id: '$user', bookings: { $sum: 1 }, paid: { $sum: { $subtract: ['$amountPaid', '$amountRefunded'] } } } }])
  const map = Object.fromEntries(stats.map((s) => [String(s._id), s]))
  res.json({ items: users.map((u) => ({ ...u.toJSON(), bookingCount: map[u.id]?.bookings || 0, totalPaid: map[u.id]?.paid || 0 })) })
})

r.get('/customers/:id', async (req, res) => {
  ensureId(req.params.id)
  const user = await User.findById(req.params.id)
  if (!user) throw notFound()
  const items = await Booking.find({ user: user._id }).sort({ createdAt: -1 })
  res.json({ user: user.toJSON(), bookings: items.map((b) => b.toJSON()) })
})

/* ============================== Contacts & newsletter ============================== */
r.get('/contacts', async (_req, res) => res.json({ items: (await Contact.find().sort({ createdAt: -1 }).limit(2000)).map((c) => c.toJSON()) }))
r.patch('/contacts/:id', validate(statusSchema(['new', 'read', 'replied', 'archived'])), async (req, res) => {
  ensureId(req.params.id)
  const c = await Contact.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after' })
  if (!c) throw notFound()
  res.json({ item: c.toJSON() })
})
r.delete('/contacts/:id', async (req, res) => {
  ensureId(req.params.id)
  await Contact.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

r.get('/newsletter', async (_req, res) => res.json({ items: (await Newsletter.find().sort({ subscribedAt: -1 })).map((n) => n.toJSON()) }))
r.patch('/newsletter/:id', validate(statusSchema(['subscribed', 'unsubscribed'])), async (req, res) => {
  ensureId(req.params.id)
  const n = await Newsletter.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after' })
  if (!n) throw notFound()
  res.json({ item: n.toJSON() })
})
r.delete('/newsletter/:id', async (req, res) => {
  ensureId(req.params.id)
  await Newsletter.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

/* ============================== Settings & system ============================== */
r.get('/settings/raw', async (_req, res) => res.json({ settings: (await getRawSettings()) || {} }))
r.put('/settings', validate(settingsSchema), async (req, res) => res.json({ settings: await saveSettings(req.body) }))

r.get('/admins', async (_req, res) => res.json({ items: (await User.find({ role: 'admin' }).sort({ createdAt: 1 })).map((u) => u.toJSON()) }))
r.post('/admins', validate(setAdminSchema), async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) throw notFound('No account exists with that email. Ask them to sign up first.')
  if (!req.body.admin && String(user._id) === String(req.user._id)) throw badRequest('You cannot remove your own admin access.')
  user.role = req.body.admin ? 'admin' : 'customer'
  await user.save()
  res.json({ ok: true, user: user.toJSON() })
})

r.post('/seed', async (_req, res) => res.json({ installed: await installStarterContent() }))

/* Demo data (tagged @demo.local) — for trying every screen; removable at any time */
r.get('/demo', async (_req, res) => res.json(await demoSummary()))
r.post('/demo', async (_req, res) => res.json(await installDemoData()))
r.delete('/demo', async (req, res) => res.json(await removeDemoData({ keepAdmin: req.user.email === 'admin@demo.local' })))

r.get('/system', async (_req, res) => {
  const [mailSent, mailUnsent] = await Promise.all([EmailLog.countDocuments({ status: 'sent' }), EmailLog.countDocuments({ status: { $ne: 'sent' } })])
  res.json({
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    email: { configured: emailConfigured(), sent: mailSent, notSent: mailUnsent },
    payments: { configured: paymentsConfigured() },
    googleAuth: { configured: !!firebaseAuth() },
    payments_count: await Payment.estimatedDocumentCount(),
  })
})

export default r
