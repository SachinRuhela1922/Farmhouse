import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { EmailLog } from '../models/Booking.js'

let transporter
const configured = () => Boolean(env.smtp.host && env.smtp.from)

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  })
  return transporter
}

export const emailConfigured = configured

/**
 * Send an email via SMTP. Never throws (email failure must not break bookings).
 * Every attempt is logged in `emaillogs` with an honest status: sent / failed / not_configured.
 */
export async function sendEmail({ to, subject, html, devLink }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean)
  if (!recipients.length) return { status: 'skipped' }
  if (!configured()) {
    await EmailLog.create({ to: recipients, subject, status: 'not_configured' }).catch(() => {})
    if (!env.isProd && !env.isTest) console.warn(`✉  [email not configured] "${subject}" → ${recipients.join(', ')}${devLink ? `\n   link: ${devLink}` : ''}`)
    return { status: 'not_configured' }
  }
  try {
    await getTransporter().sendMail({ from: env.smtp.from, to: recipients.join(', '), subject, html })
    await EmailLog.create({ to: recipients, subject, status: 'sent' }).catch(() => {})
    return { status: 'sent' }
  } catch (e) {
    console.error('✉  email failed:', e.message)
    await EmailLog.create({ to: recipients, subject, status: 'failed', error: e.message?.slice(0, 300) }).catch(() => {})
    return { status: 'failed' }
  }
}

/* ------------------------------- Templates ------------------------------- */
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const money = (n, c = 'INR') => new Intl.NumberFormat(c === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: c }).format(n || 0)
const fdate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const appUrl = (path) => `${env.clientUrls[0] || ''}${path}`
const button = (href, label) => `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#3f5a47;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none">${label}</a></p>`

function layout(brand, title, body) {
  return `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Helvetica,Arial,sans-serif;color:#2d3a31">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#3f5a47;color:#f6efe1;padding:28px 32px;font-family:Georgia,serif;font-size:22px">${esc(brand)}</td></tr>
    <tr><td style="padding:32px"><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 16px">${esc(title)}</h1>${body}</td></tr>
    <tr><td style="padding:20px 32px;background:#faf8f3;font-size:12px;color:#7a837c">This is an automated message from ${esc(brand)}.</td></tr>
  </table></td></tr></table></body></html>`
}

function bookingTable(b) {
  const row = (k, v) => `<tr><td style="padding:6px 0;color:#7a837c">${k}</td><td style="padding:6px 0;text-align:right">${v}</td></tr>`
  return `<table width="100%" style="font-size:14px;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0">
    ${row('Booking ID', `<b>${esc(b.bookingId)}</b>`)}${row('Stay', esc(b.accommodationName))}
    ${row('Check-in', fdate(b.checkIn))}${row('Check-out', fdate(b.checkOut))}
    ${row('Guests', `${b.adults} adults${b.children ? `, ${b.children} children` : ''}`)}
    ${row('Total', `<b>${money(b.totalAmount, b.pricing?.currency)}</b>`)}</table>`
}

export const templates = {
  verifyEmail: (brand, name, link) => ({
    subject: `Verify your email — ${brand}`,
    html: layout(brand, `Welcome, ${esc(name.split(' ')[0])}!`, `<p>Please confirm your email address to start booking.</p>${button(link, 'Verify email')}<p style="font-size:12px;color:#7a837c">This link expires in 24 hours.</p>`),
  }),
  resetPassword: (brand, link) => ({
    subject: `Reset your password — ${brand}`,
    html: layout(brand, 'Reset your password', `<p>We received a request to reset your password.</p>${button(link, 'Choose a new password')}<p style="font-size:12px;color:#7a837c">This link expires in 1 hour. If you didn't ask for this, ignore this email.</p>`),
  }),
  bookingReceived: (brand, b) => ({
    subject: `We've received your booking request — ${b.bookingId}`,
    html: layout(brand, `Thank you, ${esc(b.guestName.split(' ')[0])}!`, `<p>Your booking request is <b>pending confirmation</b>. We'll email you as soon as our team confirms it.</p>${bookingTable(b)}${button(appUrl(`/account/bookings/${b.bookingId}`), 'View booking')}`),
  }),
  adminNewBooking: (brand, b) => ({
    subject: `New booking request ${b.bookingId} — ${b.guestName}`,
    html: layout(brand, 'New booking request', `<p>${esc(b.guestName)} (${esc(b.email)}, ${esc(b.phone)}) requested a stay.</p>${bookingTable(b)}${b.specialRequests ? `<p><b>Requests:</b> ${esc(b.specialRequests)}</p>` : ''}${button(appUrl('/admin/bookings'), 'Open dashboard')}`),
  }),
  statusChanged: (brand, b, status, note) => {
    const copy = {
      confirmed: ['Your booking is confirmed', 'Great news — your stay is confirmed. You can now pay the advance or full amount securely from your booking page.'],
      rejected: ['About your booking request', 'Unfortunately we are unable to accept this booking request. The dates have been released.'],
      cancelled: ['Your booking has been cancelled', 'Your booking has been cancelled. Any eligible refund will be processed to your original payment method.'],
      completed: ['Thank you for staying with us', 'We hope you had a wonderful stay. We would love to welcome you back.'],
    }[status] || ['Booking update', `Your booking status is now ${status}.`]
    return {
      subject: `${copy[0]} — ${b.bookingId}`,
      html: layout(brand, copy[0], `<p>${copy[1]}</p>${note ? `<p style="background:#f6f3ec;padding:12px;border-radius:8px"><b>Note from our team:</b> ${esc(note)}</p>` : ''}${bookingTable(b)}${button(appUrl(`/account/bookings/${b.bookingId}`), 'View booking')}`),
    }
  },
  paymentReceived: (brand, b, amount) => ({
    subject: `Payment received — ${b.bookingId}`,
    html: layout(brand, 'Payment received', `<p>We've received your payment of <b>${money(amount, b.pricing?.currency)}</b>. Thank you!</p>${bookingTable(b)}`),
  }),
  adminContact: (brand, c) => ({
    subject: `New enquiry from ${c.name}${c.subject ? ` — ${c.subject}` : ''}`,
    html: layout(brand, 'New website enquiry', `<p><b>${esc(c.name)}</b> · ${esc(c.email)}${c.phone ? ` · ${esc(c.phone)}` : ''}</p><p style="white-space:pre-line">${esc(c.message)}</p>`),
  }),
  cancellationRequested: (brand, b, reason) => ({
    subject: `Cancellation requested — ${b.bookingId}`,
    html: layout(brand, 'Cancellation requested', `<p>${esc(b.guestName)} requested to cancel a confirmed booking.</p>${reason ? `<p><b>Reason:</b> ${esc(reason)}</p>` : ''}${bookingTable(b)}`),
  }),
}
export { appUrl }
