import { Router } from 'express'
import { validate } from '../utils/http.js'
import { requireAuth } from '../middleware/auth.js'
import * as payments from '../services/paymentService.js'
import { verifyWebhookSignature } from '../services/razorpay.js'
import { env } from '../config/env.js'
import { orderSchema, verifySchema } from '../validations/schemas.js'

const r = Router()

r.post('/order', requireAuth, validate(orderSchema), async (req, res) => {
  res.json(await payments.createOrder(req.user, req.body.bookingId, req.body.mode))
})

r.post('/verify', requireAuth, validate(verifySchema), async (req, res) => {
  const out = await payments.verifyPayment(req.user, req.body)
  res.json({ ok: true, paymentStatus: out.paymentStatus })
})

/**
 * Razorpay webhook. Mounted in app.js with express.raw() so the signature is
 * computed over the exact bytes Razorpay sent.
 */
export async function razorpayWebhook(req, res) {
  const sig = req.get('x-razorpay-signature')
  const raw = req.body
  if (!env.razorpay.webhookSecret || !sig || !Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, sig, env.razorpay.webhookSecret))
    return res.status(400).send('Invalid signature')
  try {
    const body = JSON.parse(raw.toString('utf8'))
    await payments.handleWebhook(body.event, body.payload)
    res.status(200).send('ok')
  } catch (e) {
    console.error('[webhook]', e)
    res.status(500).send('error')
  }
}

export default r
