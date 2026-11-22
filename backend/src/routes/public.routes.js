import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { validate, notFound } from '../utils/http.js'
import { Accommodation, Experience, Gallery, Testimonial, Faq, Contact, Newsletter } from '../models/Content.js'
import { NightLock } from '../models/Booking.js'
import { getSettings, publicSettings } from '../services/settingsService.js'
import { streamMedia } from '../services/mediaService.js'
import { sendEmail, templates } from '../services/emailService.js'
import { contactSchema, newsletterSchema } from '../validations/schemas.js'
import { todayIn } from '../utils/dates.js'

const r = Router()
const submitLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many submissions. Please try again later.', code: 'resource-exhausted' } } })
const sorted = { displayOrder: 1, createdAt: 1 }

r.get('/settings', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30')
  res.json({ settings: publicSettings(await getSettings()) })
})

r.get('/accommodations', async (_req, res) => res.json({ items: (await Accommodation.find({ isActive: true }).sort(sorted)).map((d) => d.toJSON()) }))

r.get('/accommodations/:slug', async (req, res) => {
  const { slug } = req.params
  const or = [{ slug }]
  if (mongoose.isValidObjectId(slug)) or.push({ _id: slug })
  const item = await Accommodation.findOne({ isActive: true, $or: or })
  if (!item) throw notFound('This stay is not available.')
  res.json({ item: item.toJSON() })
})

/** Booked nights (no personal data) for the date picker. */
r.get('/availability/:accommodationId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.accommodationId)) throw notFound()
  const settings = await getSettings()
  const locks = await NightLock.find({ accommodation: req.params.accommodationId, date: { $gte: todayIn(settings.bookingSettings.timezone) } }).select('date -_id').lean()
  res.json({ dates: locks.map((l) => l.date).sort() })
})

r.get('/experiences', async (_req, res) => res.json({ items: (await Experience.find({ isActive: true }).sort(sorted)).map((d) => d.toJSON()) }))
r.get('/gallery', async (_req, res) => res.json({ items: (await Gallery.find({ isActive: true }).sort(sorted)).map((d) => d.toJSON()) }))
r.get('/testimonials', async (_req, res) => res.json({ items: (await Testimonial.find({ isPublished: true }).sort(sorted)).map((d) => d.toJSON()) }))
r.get('/faqs', async (_req, res) => res.json({ items: (await Faq.find({ isActive: true }).sort(sorted)).map((d) => d.toJSON()) }))

r.post('/contact', submitLimit, validate(contactSchema), async (req, res) => {
  const c = await Contact.create(req.body)
  const s = await getSettings()
  if (s.contact?.email) sendEmail({ ...templates.adminContact(s.businessName, c), to: s.contact.email })
  res.status(201).json({ ok: true, id: c.id })
})

r.post('/newsletter', submitLimit, validate(newsletterSchema), async (req, res) => {
  const existing = await Newsletter.findOne({ email: req.body.email })
  if (existing?.status === 'subscribed') return res.json({ status: 'exists' })
  if (existing) {
    existing.status = 'subscribed'
    existing.subscribedAt = new Date()
    await existing.save()
  } else await Newsletter.create({ email: req.body.email })
  res.status(201).json({ status: 'subscribed' })
})

r.get('/media/:id', async (req, res) => streamMedia(req.params.id, req, res))

export default r
