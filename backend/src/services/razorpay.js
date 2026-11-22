import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { ApiError, precondition } from '../utils/http.js'

const API = 'https://api.razorpay.com/v1'

export const paymentsConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret)

/** Minimal Razorpay REST client (no SDK). Card data never touches our servers. */
export function razorpay() {
  if (!paymentsConfigured()) throw precondition('Online payments are not configured yet. Please contact us to complete payment.')
  const authHeader = 'Basic ' + Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64')
  async function req(method, path, body) {
    const res = await fetch(`${API}${path}`, { method, headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(502, json?.error?.description || `Payment gateway error (${res.status}).`, 'gateway-error')
    return json
  }
  return {
    createOrder: (o) => req('POST', '/orders', o),
    fetchPayment: (id) => req('GET', `/payments/${encodeURIComponent(id)}`),
    refund: (id, amountPaise, notes) => req('POST', `/payments/${encodeURIComponent(id)}/refund`, { amount: amountPaise, speed: 'normal', notes }),
  }
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature({ orderId, paymentId, signature, secret }) {
  return safeEqual(createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'), signature)
}

/** Webhook signature: HMAC_SHA256(rawBody, webhook_secret). */
export function verifyWebhookSignature(rawBody, signature, secret) {
  return safeEqual(createHmac('sha256', secret).update(rawBody).digest('hex'), signature)
}

export const toPaise = (amount) => Math.round(Number(amount) * 100)
export const fromPaise = (p) => Math.round(Number(p)) / 100
