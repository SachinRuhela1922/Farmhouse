/**
 * End-to-end API tests against a real MongoDB replica set (in-memory) — exercises auth/JWT,
 * role protection, server-side pricing, transactions and concurrent double-booking attempts.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { randomBytes, createHash } from 'node:crypto'

let repl, server, base, mongoose, User, models
const today = new Date(Date.now() + 5.5 * 3600 * 1000) // IST
const plus = (n) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + n)).toISOString().slice(0, 10)

before(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  Object.assign(process.env, {
    NODE_ENV: 'test', MONGODB_URI: repl.getUri('farmhouse_test'),
    JWT_ACCESS_SECRET: randomBytes(48).toString('hex'), JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
    CLIENT_URL: 'http://localhost:5173', SMTP_HOST: '', RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '',
  })
  const { connectDB } = await import('../src/config/db.js')
  const { createApp } = await import('../src/app.js')
  mongoose = (await import('mongoose')).default
  ;({ User } = await import('../src/models/User.js'))
  models = await import('../src/models/Booking.js')
  await connectDB(process.env.MONGODB_URI)
  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  server?.close()
  await mongoose?.disconnect()
  await repl?.stop()
})

async function api(path, { method = 'GET', body, token, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...(cookie && { Cookie: cookie }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json, setCookie: res.headers.get('set-cookie') }
}
const cookieOf = (setCookie) => setCookie?.split(';')[0]

async function registerUser(email, { verified = true } = {}) {
  const r = await api('/auth/register', { method: 'POST', body: { fullName: 'Test Guest', email, phone: '+91 98765 43210', password: 'secret123' } })
  assert.equal(r.status, 201, JSON.stringify(r.json))
  if (verified) await User.updateOne({ email }, { emailVerified: true })
  return { token: r.json.accessToken, user: r.json.user, cookie: cookieOf(r.setCookie) }
}

let admin, guest, guest2, stay

test('register: role cannot be self-assigned; password never returned', async () => {
  const inj = await api('/auth/register', { method: 'POST', body: { fullName: 'Evil', email: 'evil@test.com', phone: '+91 98765 43210', password: 'secret123', role: 'admin' } })
  assert.equal(inj.status, 400) // strict schema rejects unknown keys
  guest = await registerUser('guest@test.com')
  assert.equal(guest.user.role, 'customer')
  assert.equal(guest.user.passwordHash, undefined)
  const dup = await api('/auth/register', { method: 'POST', body: { fullName: 'Dup', email: 'GUEST@test.com', phone: '+91 98765 43210', password: 'secret123' } })
  assert.equal(dup.status, 409)
})

test('login + JWT + refresh rotation with reuse detection', async () => {
  assert.equal((await api('/auth/login', { method: 'POST', body: { email: 'guest@test.com', password: 'wrongpass1' } })).status, 401)
  const ok = await api('/auth/login', { method: 'POST', body: { email: 'guest@test.com', password: 'secret123' } })
  assert.equal(ok.status, 200)
  assert.ok(ok.json.accessToken)
  assert.match(ok.setCookie, /HttpOnly/i)
  const me = await api('/auth/me', { token: ok.json.accessToken })
  assert.equal(me.json.user.email, 'guest@test.com')
  assert.equal((await api('/auth/me', { token: 'garbage' })).status, 401)

  const c1 = cookieOf(ok.setCookie)
  const r1 = await api('/auth/refresh', { method: 'POST', cookie: c1 })
  assert.equal(r1.status, 200)
  const c2 = cookieOf(r1.setCookie)
  assert.notEqual(c1, c2)
  // Reusing the rotated token is rejected and revokes the family
  assert.equal((await api('/auth/refresh', { method: 'POST', cookie: c1 })).status, 401)
  assert.equal((await api('/auth/refresh', { method: 'POST', cookie: c2 })).status, 401)
})

test('email verification & password reset tokens', async () => {
  await registerUser('verify@test.com', { verified: false })
  const token = randomBytes(32).toString('base64url')
  await User.updateOne({ email: 'verify@test.com' }, { emailVerifyTokenHash: createHash('sha256').update(token).digest('hex'), emailVerifyExpires: new Date(Date.now() + 60000) })
  assert.equal((await api('/auth/verify-email', { method: 'POST', body: { token: 'x'.repeat(30) } })).status, 400)
  const v = await api('/auth/verify-email', { method: 'POST', body: { token } })
  assert.equal(v.status, 200)
  assert.equal(v.json.user.emailVerified, true)
  // forgot-password never reveals existence
  assert.equal((await api('/auth/forgot-password', { method: 'POST', body: { email: 'nobody@test.com' } })).status, 200)
})

test('admin routes are protected', async () => {
  assert.equal((await api('/admin/stats')).status, 401)
  assert.equal((await api('/admin/stats', { token: guest.token })).status, 403)
  admin = await registerUser('admin@test.com')
  await User.updateOne({ email: 'admin@test.com' }, { role: 'admin' })
  // role is re-read from DB on every request, so the existing token now works
  assert.equal((await api('/admin/stats', { token: admin.token })).status, 200)
})

test('seed starter content & public content API', async () => {
  const s = await api('/admin/seed', { method: 'POST', token: admin.token })
  assert.equal(s.status, 200)
  assert.ok(s.json.installed.length >= 5)
  const list = await api('/accommodations')
  assert.equal(list.json.items.length, 4)
  stay = list.json.items.find((a) => a.slug === 'orchard-pool-villa')
  assert.ok(stay.id)
  assert.equal((await api(`/accommodations/${stay.slug}`)).json.item.name, 'Orchard Pool Villa')
  const settings = await api('/settings')
  assert.equal(settings.json.settings.businessName, 'Willowmere Farmhouse')
})

test('quote is computed server-side; past dates rejected', async () => {
  const q = await api('/bookings/quote', { method: 'POST', body: { accommodationId: stay.id, checkIn: plus(10), checkOut: plus(12), adults: 2, children: 0, services: ['bonfire'] } })
  assert.equal(q.status, 200, JSON.stringify(q.json))
  assert.equal(q.json.available, true)
  assert.equal(q.json.nights, 2)
  assert.ok(q.json.totalAmount > 0)
  const past = await api('/bookings/quote', { method: 'POST', body: { accommodationId: stay.id, checkIn: plus(-2), checkOut: plus(1), adults: 2 } })
  assert.equal(past.status, 400)
  const over = await api('/bookings/quote', { method: 'POST', body: { accommodationId: stay.id, checkIn: plus(10), checkOut: plus(12), adults: 9 } })
  assert.equal(over.status, 400)
})

const bookingBody = (extra = {}) => ({ accommodationId: stay.id, checkIn: plus(20), checkOut: plus(23), adults: 2, children: 0, services: [], guestName: 'Test Guest', email: 'guest@test.com', phone: '+91 98765 43210', ...extra })

test('booking requires auth + verified email; client prices ignored', async () => {
  assert.equal((await api('/bookings', { method: 'POST', body: bookingBody() })).status, 401)
  const unverified = await registerUser('unverified@test.com', { verified: false })
  assert.equal((await api('/bookings', { method: 'POST', token: unverified.token, body: bookingBody() })).status, 412)

  const quote = await api('/bookings/quote', { method: 'POST', body: bookingBody() })
  const r = await api('/bookings', { method: 'POST', token: guest.token, body: bookingBody({ totalAmount: 1, pricing: { totalAmount: 1 } }) })
  assert.equal(r.status, 201, JSON.stringify(r.json))
  assert.match(r.json.bookingId, /^WM-\d{6}-[A-Z0-9]{6}$/)
  assert.equal(r.json.totalAmount, quote.json.totalAmount) // tampered price ignored
  assert.equal(r.json.booking.bookingStatus, 'pending')
  assert.equal(await models.NightLock.countDocuments({ bookingId: r.json.bookingId }), 3)
})

test('double booking: overlapping request is rejected (409)', async () => {
  guest2 = await registerUser('guest2@test.com')
  const r = await api('/bookings', { method: 'POST', token: guest2.token, body: bookingBody({ checkIn: plus(22), checkOut: plus(24), email: 'guest2@test.com' }) })
  assert.equal(r.status, 409)
  const q = await api('/bookings/quote', { method: 'POST', body: bookingBody({ checkIn: plus(21), checkOut: plus(22) }) })
  assert.equal(q.json.available, false)
  // Back-to-back (checkout day = next check-in) is allowed
  const b2b = await api('/bookings', { method: 'POST', token: guest2.token, body: bookingBody({ checkIn: plus(23), checkOut: plus(24), email: 'guest2@test.com' }) })
  assert.equal(b2b.status, 201, JSON.stringify(b2b.json))
})

test('double booking under concurrency: exactly one of N simultaneous requests wins', async () => {
  const users = await Promise.all([1, 2, 3, 4, 5].map((i) => registerUser(`race${i}@test.com`)))
  const results = await Promise.all(users.map((u, i) => api('/bookings', { method: 'POST', token: u.token, body: bookingBody({ checkIn: plus(40), checkOut: plus(43), email: `race${i + 1}@test.com` }) })))
  const statuses = results.map((r) => r.status).sort()
  assert.deepEqual(statuses, [201, 409, 409, 409, 409], JSON.stringify(results.map((r) => r.json)))
  assert.equal(await models.NightLock.countDocuments({ accommodation: stay.id, date: { $in: [plus(40), plus(41), plus(42)] } }), 3)
  assert.equal(await models.Booking.countDocuments({ checkIn: plus(40) }), 1)
})

test('ownership, cancellation releases nights, admin transitions', async () => {
  const mine = await api('/bookings/mine', { token: guest.token })
  const b = mine.json.items.find((x) => x.checkIn === plus(20))
  assert.ok(b)
  assert.equal((await api(`/bookings/${b.bookingId}`, { token: guest2.token })).status, 404) // not theirs
  assert.equal((await api(`/bookings/${b.bookingId}`, { token: admin.token })).status, 200)

  // admin confirm → guest cancellation becomes a request
  assert.equal((await api(`/admin/bookings/${b.bookingId}`, { method: 'PATCH', token: guest.token, body: { status: 'confirmed' } })).status, 403)
  const conf = await api(`/admin/bookings/${b.bookingId}`, { method: 'PATCH', token: admin.token, body: { status: 'confirmed', note: 'See you soon' } })
  assert.equal(conf.json.booking.bookingStatus, 'confirmed')
  assert.equal((await api(`/admin/bookings/${b.bookingId}`, { method: 'PATCH', token: admin.token, body: { status: 'rejected' } })).status, 412) // invalid transition
  const req = await api(`/bookings/${b.bookingId}/cancel`, { method: 'POST', token: guest.token, body: { reason: 'Plans changed' } })
  assert.equal(req.json.status, 'requested')

  // admin cancels → nights released → others can book
  await api(`/admin/bookings/${b.bookingId}`, { method: 'PATCH', token: admin.token, body: { status: 'cancelled' } })
  assert.equal(await models.NightLock.countDocuments({ bookingId: b.bookingId }), 0)
  const rebook = await api('/bookings', { method: 'POST', token: guest2.token, body: bookingBody({ checkIn: plus(20), checkOut: plus(22), email: 'guest2@test.com' }) })
  assert.equal(rebook.status, 201, JSON.stringify(rebook.json))
})

test('payments: offline payment updates status; online payments report not-configured honestly', async () => {
  const mine = await api('/bookings/mine', { token: guest2.token })
  const b = mine.json.items.find((x) => x.checkIn === plus(20))
  await api(`/admin/bookings/${b.bookingId}`, { method: 'PATCH', token: admin.token, body: { status: 'confirmed' } })
  const order = await api('/payments/order', { method: 'POST', token: guest2.token, body: { bookingId: b.bookingId, mode: 'advance' } })
  assert.equal(order.status, 412)
  assert.match(order.json.error.message, /not configured/)
  const pay = await api(`/admin/bookings/${b.bookingId}/offline-payment`, { method: 'POST', token: admin.token, body: { amount: 1000, method: 'cash' } })
  assert.equal(pay.status, 200, JSON.stringify(pay.json))
  assert.equal(pay.json.paymentStatus, 'partially_paid')
  const over = await api(`/admin/bookings/${b.bookingId}/offline-payment`, { method: 'POST', token: admin.token, body: { amount: 99999999 } })
  assert.equal(over.status, 400)
  const list = await api(`/bookings/${b.bookingId}/payments`, { token: guest2.token })
  assert.equal(list.json.items.length, 1)
})

test('admin CRUD, settings, stats', async () => {
  const created = await api('/admin/content/faqs', { method: 'POST', token: admin.token, body: { question: 'Is parking free?', answer: 'Yes, for up to 6 cars.' } })
  assert.equal(created.status, 201)
  assert.equal((await api('/admin/content/faqs', { method: 'POST', token: admin.token, body: { question: 'x' } })).status, 400)
  await api(`/admin/content/faqs/${created.json.item.id}`, { method: 'PATCH', token: admin.token, body: { isActive: false } })
  const pub = await api('/faqs')
  assert.ok(!pub.json.items.some((f) => f.id === created.json.item.id)) // hidden from public
  assert.equal((await api(`/admin/content/faqs/${created.json.item.id}`, { method: 'DELETE', token: admin.token })).status, 200)

  const s = await api('/admin/settings', { method: 'PUT', token: admin.token, body: { businessName: 'Test Farm', taxSettings: { taxPercent: 18 } } })
  assert.equal(s.json.settings.businessName, 'Test Farm')
  assert.equal(s.json.settings.taxSettings.taxPercent, 18)
  assert.equal(s.json.settings.taxSettings.cleaningFee, 1000) // deep-merged
  const stats = await api('/admin/stats', { token: admin.token })
  assert.ok(stats.json.total >= 3)
  assert.equal(stats.json.monthly.length, 12)
})

test('contact, newsletter (dedupe), media upload to GridFS', async () => {
  assert.equal((await api('/contact', { method: 'POST', body: { name: 'A', email: 'bad', message: 'short' } })).status, 400)
  assert.equal((await api('/contact', { method: 'POST', body: { name: 'Asha', email: 'asha@test.com', message: 'Do you allow pets in the cottage?' } })).status, 201)
  assert.equal((await api('/newsletter', { method: 'POST', body: { email: 'n@test.com' } })).json.status, 'subscribed')
  assert.equal((await api('/newsletter', { method: 'POST', body: { email: 'N@test.com' } })).json.status, 'exists')

  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a80000000049454e44ae426082', 'hex')
  const fd = new FormData()
  fd.append('file', new Blob([png], { type: 'image/png' }), 'dot.png')
  fd.append('folder', 'test')
  const up = await fetch(`${base}/admin/media`, { method: 'POST', headers: { Authorization: `Bearer ${admin.token}` }, body: fd })
  const upJson = await up.json()
  assert.equal(up.status, 201, JSON.stringify(upJson))
  const img = await fetch(`http://127.0.0.1:${server.address().port}${upJson.url}`)
  assert.equal(img.status, 200)
  assert.equal(img.headers.get('content-type'), 'image/png')
  assert.equal(Buffer.from(await img.arrayBuffer()).length, png.length)

  const fake = new FormData()
  fake.append('file', new Blob([Buffer.from('<script>alert(1)</script>')], { type: 'image/png' }), 'x.png')
  assert.equal((await fetch(`${base}/admin/media`, { method: 'POST', headers: { Authorization: `Bearer ${admin.token}` }, body: fake })).status, 400)
  const asGuest = new FormData()
  asGuest.append('file', new Blob([png], { type: 'image/png' }), 'dot.png')
  assert.equal((await fetch(`${base}/admin/media`, { method: 'POST', headers: { Authorization: `Bearer ${guest.token}` }, body: asGuest })).status, 403)
})

test('demo data: installs every collection without overlaps, and is fully removable', async () => {
  const r = await api('/admin/demo', { method: 'POST', token: admin.token })
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.ok(r.json.bookings >= 20, `bookings=${r.json.bookings}`)
  assert.equal(r.json.users, 9) // 8 customers + demo admin
  assert.equal(r.json.contacts, 6)
  assert.equal(r.json.newsletter, 8)
  // statuses all represented
  const all = await api('/admin/bookings', { token: admin.token })
  const statuses = new Set(all.json.items.map((b) => b.bookingStatus))
  for (const s of ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']) assert.ok(statuses.has(s), `missing ${s}`)
  // no double-booked nights: every lock is unique (enforced by index) and stats work
  const stats = await api('/admin/stats', { token: admin.token })
  assert.ok(stats.json.revenue > 0)
  assert.ok(stats.json.monthly.some((m) => m.bookings > 0))
  // demo customer can log in and see their bookings
  const login = await api('/auth/login', { method: 'POST', body: { email: 'riya@demo.local', password: 'Demo12345' } })
  assert.equal(login.status, 200)
  const mine = await api('/bookings/mine', { token: login.json.accessToken })
  assert.ok(mine.json.items.length > 0)
  // reinstall is idempotent (replaces, no duplicates)
  const again = await api('/admin/demo', { method: 'POST', token: admin.token })
  assert.equal(again.json.users, 9)
  // removal leaves real data intact
  const realBefore = await models.Booking.countDocuments({ email: { $not: /@demo\.local$/ } })
  const del = await api('/admin/demo', { method: 'DELETE', token: admin.token })
  assert.equal(del.status, 200)
  assert.equal((await api('/admin/demo', { token: admin.token })).json.bookings, 0)
  assert.equal(await models.Booking.countDocuments({ email: { $not: /@demo\.local$/ } }), realBefore)
})
