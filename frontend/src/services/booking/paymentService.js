import { api } from '../api/client'

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true)
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => { scriptPromise = null; reject(new Error('Could not load the payment gateway. Check your connection.')) }
    document.body.appendChild(s)
  })
  return scriptPromise
}

/**
 * Razorpay flow:
 * 1. API creates an order for the amount stored on the booking (never a client amount).
 * 2. Razorpay Checkout collects payment (card data never touches our servers).
 * 3. API verifies the HMAC signature + re-fetches the payment from Razorpay, then records it.
 * Resolves with the result, null if the user closes checkout; rejects on failure.
 */
export async function payForBooking({ bookingId, mode, prefill, businessName }) {
  const order = await api.post('/payments/order', { bookingId, mode })
  await loadRazorpay()
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: businessName,
      description: `Booking ${bookingId} — ${mode === 'advance' ? 'advance payment' : 'full payment'}`,
      prefill,
      notes: { bookingId },
      theme: { color: '#3f5a47' },
      handler: async (response) => {
        try {
          resolve(await api.post('/payments/verify', { bookingId, ...response }))
        } catch (e) {
          reject(e)
        }
      },
      modal: { ondismiss: () => resolve(null) },
    })
    rzp.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed.')))
    rzp.open()
  })
}
