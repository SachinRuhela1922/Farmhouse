import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import { User } from '../models/User.js'
import { Accommodation, Contact, Newsletter } from '../models/Content.js'
import { Booking, NightLock, Payment } from '../models/Booking.js'
import { getSettings } from './settingsService.js'
import { computePricing, derivePaymentStatus } from './pricing.js'
import { installStarterContent } from './seedService.js'
import { addDaysUTC, isoOf, nightsOf, parseISODate, todayIn } from '../utils/dates.js'
import { round2 } from '../utils/http.js'

/**
 * DEMO DATA — for trying out every screen. Everything created here is tagged:
 *   users/contacts/newsletter → email ends with "@demo.local"
 *   bookings/payments         → belong to those demo users (payments have source "demo")
 * removeDemoData() deletes exactly these records and nothing else.
 */
export const DEMO_DOMAIN = '@demo.local'
export const DEMO_PASSWORD = 'Demo12345'
export const DEMO_ADMIN = { email: `admin${DEMO_DOMAIN}`, password: 'Admin12345' }
const demoEmail = { $regex: `${DEMO_DOMAIN.replace('.', '\\.')}$`, $options: 'i' }

const GUESTS = [
  ['Riya Sharma', '+91 98765 11001'], ['Arjun Mehta', '+91 98765 11002'], ['Priya Nair', '+91 98765 11003'],
  ['Kabir Singh', '+91 98765 11004'], ['Ananya Iyer', '+91 98765 11005'], ['Rohan Kapoor', '+91 98765 11006'],
  ['Sneha Reddy', '+91 98765 11007'], ['Vikram Joshi', '+91 98765 11008'],
]

const REQUESTS = [
  'Celebrating our anniversary — would love some flowers in the room.',
  'Arriving late evening around 9 PM, please keep dinner ready.',
  'Two vegetarian guests and one Jain guest in the group.',
  'Birthday on the second night — can you arrange a cake?',
  '', '', 'Travelling with a small dog (well behaved).', 'Need a projector for a short team presentation.',
]

const CONTACTS = [
  ['Meera Pillai', 'Corporate offsite for 25 people', 'Hi, we are planning a two-day offsite for 25 people in March. Do you have meeting space, Wi-Fi and catering options? Please share a quote.', 'new'],
  ['Aditya Rao', 'Pre-wedding shoot', 'Is the garden pavilion available for a pre-wedding photoshoot next month? What are the charges for half a day?', 'new'],
  ['Farah Khan', 'Pets allowed?', 'We have a golden retriever. Is the Garden Cottage pet friendly and is there any extra charge?', 'read'],
  ['Nikhil Verma', 'Birthday party', 'Looking to host my daughter’s 10th birthday with around 40 guests during the day. Can you arrange décor and food?', 'replied'],
  ['Ishita Bose', 'Weekday discount', 'Do you offer any discount for a 4-night weekday stay in the Orchard Pool Villa?', 'replied'],
  ['Sameer Gupta', 'Directions', 'How far is the farmhouse from the airport and do you provide pickup?', 'archived'],
]

const pick = (arr) => arr[randomInt(arr.length)]
const bookingIdFor = (date) => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `WM-${isoOf(date).slice(2).replace(/-/g, '')}-${Array.from({ length: 6 }, () => a[randomInt(a.length)]).join('')}`
}

export async function demoSummary() {
  const users = await User.find({ email: demoEmail }).select('_id').lean()
  const ids = users.map((u) => u._id)
  return {
    users: users.length,
    bookings: await Booking.countDocuments({ user: { $in: ids } }),
    contacts: await Contact.countDocuments({ email: demoEmail }),
    newsletter: await Newsletter.countDocuments({ email: demoEmail }),
  }
}

/** keepAdmin: keep the demo admin account (used on re-install, or when the demo admin removes demo data). */
export async function removeDemoData({ keepAdmin = false } = {}) {
  const filter = keepAdmin ? { $and: [{ email: demoEmail }, { email: { $ne: DEMO_ADMIN.email } }] } : { email: demoEmail }
  const users = await User.find(filter).select('_id').lean()
  const ids = users.map((u) => u._id)
  const bookings = await Booking.find({ user: { $in: ids } }).select('_id bookingId').lean()
  await NightLock.deleteMany({ bookingId: { $in: bookings.map((b) => b.bookingId) } })
  await Payment.deleteMany({ booking: { $in: bookings.map((b) => b._id) } })
  const removed = {
    bookings: (await Booking.deleteMany({ _id: { $in: bookings.map((b) => b._id) } })).deletedCount,
    users: (await User.deleteMany({ _id: { $in: ids } })).deletedCount,
    contacts: (await Contact.deleteMany({ email: demoEmail })).deletedCount,
    newsletter: (await Newsletter.deleteMany({ email: demoEmail })).deletedCount,
  }
  return removed
}

/**
 * Create a full demo dataset. Replaces any previous demo data (real data is untouched).
 * Bookings never overlap each other or existing real bookings (night locks are respected).
 */
export async function installDemoData() {
  const starter = await installStarterContent()
  await removeDemoData({ keepAdmin: true })

  const settings = await getSettings()
  const { bookingSettings: bs, taxSettings: tax } = settings
  const stays = await Accommodation.find({ isActive: true }).sort({ displayOrder: 1 }).lean()
  if (!stays.length) throw new Error('No active accommodations — cannot create demo bookings.')

  /* ---------- users ---------- */
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const now = Date.now()
  const users = await User.insertMany(GUESTS.map(([fullName, phone], i) => ({
    fullName, phone, email: `${fullName.split(' ')[0].toLowerCase()}${DEMO_DOMAIN}`, passwordHash: hash,
    authProviders: ['password'], role: 'customer', emailVerified: i !== GUESTS.length - 1, // last one unverified (to test the banner)
    createdAt: new Date(now - (330 - i * 35) * 86400000),
  })))
  const adminExists = await User.exists({ email: DEMO_ADMIN.email })
  if (!adminExists)
    await User.create({ fullName: 'Demo Admin', email: DEMO_ADMIN.email, phone: '+91 90000 00000', passwordHash: await bcrypt.hash(DEMO_ADMIN.password, 10), authProviders: ['password'], role: 'admin', emailVerified: true })
  else await User.updateOne({ email: DEMO_ADMIN.email }, { role: 'admin' })
  const customers = users.slice(0, -1)

  /* ---------- bookings ---------- */
  const today = todayIn(bs.timezone)
  const todayD = parseISODate(today)
  // Free-night checker per stay, seeded with existing real locks
  const taken = new Map()
  for (const s of stays) taken.set(String(s._id), new Set((await NightLock.find({ accommodation: s._id }).select('date').lean()).map((l) => l.date)))
  const isFree = (stay, ci, co) => nightsOf(ci, co).every((d) => !taken.get(String(stay._id)).has(d))

  // [daysFromToday, nights, status, payment] — past stays, current month and upcoming
  const plan = [
    [-320, 2, 'completed', 'paid'], [-290, 3, 'completed', 'paid'], [-262, 2, 'completed', 'paid'], [-240, 1, 'cancelled', 'none'],
    [-210, 2, 'completed', 'paid'], [-180, 4, 'completed', 'paid'], [-150, 2, 'completed', 'paid'], [-131, 2, 'rejected', 'none'],
    [-120, 3, 'completed', 'paid'], [-95, 2, 'completed', 'paid'], [-70, 2, 'completed', 'paid'], [-48, 3, 'completed', 'paid'],
    [-30, 2, 'completed', 'paid'], [-16, 2, 'completed', 'paid'], [-8, 2, 'completed', 'paid'], [-4, 1, 'cancelled', 'refunded'],
    [2, 2, 'confirmed', 'paid'], [5, 3, 'confirmed', 'advance'], [9, 2, 'confirmed', 'unpaid'], [12, 2, 'pending', 'none'],
    [16, 3, 'pending', 'none'], [21, 2, 'confirmed', 'advance'], [27, 2, 'pending', 'none'], [34, 4, 'confirmed', 'paid'],
    [41, 2, 'confirmed', 'unpaid'], [48, 2, 'rejected', 'none'], [55, 3, 'pending', 'none'], [63, 2, 'confirmed', 'advance'],
  ]

  const docs = []
  const locks = []
  const payments = []
  for (const [i, [offset, nights, status, pay]] of plan.entries()) {
    const stay = stays[i % stays.length]
    let ci = isoOf(addDaysUTC(todayD, offset))
    let co = isoOf(addDaysUTC(todayD, offset + nights))
    // shift forward until free (keeps demo data from overlapping real bookings)
    for (let s = 0; s < 30 && !isFree(stay, ci, co); s++) {
      ci = isoOf(addDaysUTC(parseISODate(ci), 1))
      co = isoOf(addDaysUTC(parseISODate(co), 1))
    }
    if (!isFree(stay, ci, co)) continue

    const guest = customers[i % customers.length]
    const adults = Math.max(1, Math.min(stay.capacity - 1, 2 + (i % 3)))
    const children = stay.capacity - adults >= 1 ? i % 2 : 0
    const services = (bs.services || []).filter((_, k) => (i + k) % 3 === 0).map((s) => s.id).slice(0, 2)
    const pricing = computePricing({ accommodation: stay, checkIn: ci, checkOut: co, adults, children, serviceIds: services, booking: bs, tax })

    // created 3–40 days before check-in (never in the future)
    const created = new Date(Math.min(now - 3600000, parseISODate(ci).getTime() - (3 + (i * 7) % 38) * 86400000))
    const bookingId = bookingIdFor(created)
    const at = (d) => new Date(created.getTime() + d * 3600000)
    const history = [{ status: 'pending', by: 'guest', at: created }]
    if (['confirmed', 'completed'].includes(status) || (status === 'cancelled' && pay === 'refunded')) history.push({ status: 'confirmed', by: 'admin', at: at(5), note: 'Looking forward to hosting you!' })
    if (status === 'completed') history.push({ status: 'completed', by: 'system', at: new Date(parseISODate(co).getTime() + 12 * 3600000) })
    if (status === 'rejected') history.push({ status: 'rejected', by: 'admin', at: at(8), note: 'Sorry, the property is closed for maintenance on these dates.' })
    if (status === 'cancelled') history.push({ status: 'cancelled', by: pay === 'refunded' ? 'admin' : 'guest', at: at(30), note: 'Plans changed' })

    let amountPaid = 0
    let amountRefunded = 0
    const payRecords = []
    const total = pricing.totalAmount
    const method = pick(['upi', 'card', 'netbanking', 'cash', 'bank_transfer'])
    if (pay === 'paid' || pay === 'refunded') {
      if (i % 2) {
        payRecords.push({ amount: pricing.advanceAmount, mode: 'advance', at: at(10) })
        payRecords.push({ amount: round2(total - pricing.advanceAmount), mode: 'full', at: at(48) })
      } else payRecords.push({ amount: total, mode: 'full', at: at(12) })
    } else if (pay === 'advance') payRecords.push({ amount: pricing.advanceAmount, mode: 'advance', at: at(10) })
    for (const p of payRecords) amountPaid = round2(amountPaid + p.amount)
    if (pay === 'refunded') amountRefunded = amountPaid

    const doc = {
      bookingId, user: guest._id, guestName: guest.fullName, email: guest.email, phone: guest.phone,
      accommodation: stay._id, accommodationName: stay.name, checkIn: ci, checkOut: co, nights: pricing.nights,
      adults, children, guests: adults + children, services: pricing.servicesBreakdown.map((s) => s.id),
      specialRequests: REQUESTS[i % REQUESTS.length], pricing, totalAmount: total, amountPaid, amountRefunded,
      paymentStatus: pay === 'none' ? 'unpaid' : derivePaymentStatus({ totalAmount: total, amountPaid, amountRefunded }),
      bookingStatus: status, statusHistory: history,
      adminNote: history.find((h) => h.by === 'admin')?.note,
      cancellationRequested: status === 'confirmed' && i === 21,
      cancellationReason: status === 'confirmed' && i === 21 ? 'Flight got rescheduled, may need to cancel.' : status === 'cancelled' ? 'Plans changed' : undefined,
      cancelledBy: status === 'cancelled' ? (pay === 'refunded' ? 'admin' : 'guest') : undefined,
      lastPaymentAt: payRecords.at(-1)?.at,
      createdAt: created, updatedAt: history.at(-1).at,
    }
    docs.push(doc)
    payRecords.forEach((p) => payments.push({ bookingId, amount: p.amount, mode: p.mode, method, createdAt: p.at, refunded: pay === 'refunded' }))
    // Active + completed stays hold their nights (same as the real flow)
    if (['pending', 'confirmed', 'completed'].includes(status)) {
      for (const d of nightsOf(ci, co)) { locks.push({ accommodation: stay._id, date: d, bookingId }); taken.get(String(stay._id)).add(d) }
    }
  }

  const inserted = await Booking.insertMany(docs, { timestamps: false })
  const byId = Object.fromEntries(inserted.map((b) => [b.bookingId, b._id]))
  if (locks.length) await NightLock.insertMany(locks)
  if (payments.length)
    await Payment.insertMany(payments.map((p) => ({
      booking: byId[p.bookingId], bookingId: p.bookingId, amount: p.amount, currency: bs.currency || 'INR', method: p.method, mode: p.mode,
      status: 'captured', source: 'demo', reference: `DEMO-${p.bookingId.slice(-6)}-${p.mode.toUpperCase()}`,
      amountRefunded: p.refunded ? p.amount : 0, refunds: p.refunded ? [{ refundId: `demo_rf_${p.bookingId.slice(-6)}`, amount: p.amount, status: 'processed', at: new Date(p.createdAt.getTime() + 40 * 3600000) }] : [],
      createdAt: p.createdAt, updatedAt: p.createdAt,
    })), { timestamps: false })

  /* ---------- contacts & newsletter ---------- */
  await Contact.insertMany(CONTACTS.map(([name, subject, message, status], i) => ({
    name, subject, message, status, email: `${name.split(' ')[0].toLowerCase()}.enquiry${DEMO_DOMAIN}`, phone: `+91 99000 2200${i}`,
    createdAt: new Date(now - (i * 4 + 1) * 86400000), updatedAt: new Date(now - (i * 4 + 1) * 86400000),
  })), { timestamps: false })
  const subs = ['travel.lover', 'weekend.escapes', 'foodie.family', 'nature.walks', 'offsite.planner', 'sunset.chaser', 'old.subscriber', 'monsoon.fan']
  await Newsletter.insertMany(subs.map((s, i) => ({ email: `${s}${DEMO_DOMAIN}`, status: i === 6 ? 'unsubscribed' : 'subscribed', subscribedAt: new Date(now - (i * 20 + 2) * 86400000) })))

  return { starter, ...(await demoSummary()), payments: payments.length, demoAdmin: adminExists ? 'existing' : 'created' }
}
