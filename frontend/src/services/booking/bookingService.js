import { api } from '../api/client'

/**
 * Bookings are created and changed only through the API. Prices, taxes and availability
 * are always computed server-side; the client only sends the guest's choices.
 */
export const getQuote = (input) => api.post('/bookings/quote', input)
export const createBooking = (input) => api.post('/bookings', input)
export const cancelMyBooking = (bookingId, reason) => api.post(`/bookings/${bookingId}/cancel`, { reason })

/* Admin */
export const adminUpdateBooking = ({ bookingId, ...data }) => api.patch(`/admin/bookings/${bookingId}`, data)
export const adminRefundPayment = ({ bookingId, paymentId, amount }) => api.post(`/admin/bookings/${bookingId}/refund`, { paymentId, amount })
export const adminRecordOfflinePayment = ({ bookingId, ...data }) => api.post(`/admin/bookings/${bookingId}/offline-payment`, data)
