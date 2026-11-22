import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { computePricing, validateStay, isWeekendNight, derivePaymentStatus } from '../src/services/pricing.js'
import { verifyCheckoutSignature, verifyWebhookSignature, toPaise } from '../src/services/razorpay.js'
import { nightsOf, todayIn, parseISODate, addDaysUTC, isoOf } from '../src/utils/dates.js'

const booking = {
  currency: 'INR', timezone: 'Asia/Kolkata', minNights: 1, maxNights: 14, maxAdvanceDays: 365, advancePaymentPercent: 30,
  services: [
    { id: 'breakfast', name: 'Breakfast', price: 450, unit: 'per_guest_night' },
    { id: 'bonfire', name: 'Bonfire', price: 3500, unit: 'per_booking' },
  ],
}
const tax = { taxLabel: 'GST', taxPercent: 12, serviceChargePercent: 5, cleaningFee: 1000 }
const acc = { name: 'Villa', pricePerNight: 10000, weekendPrice: 12000, capacity: 4 }
const plusDays = (n) => isoOf(addDaysUTC(parseISODate(todayIn('Asia/Kolkata')), n))

test('nightsOf enumerates [checkIn, checkOut)', () => {
  assert.deepEqual(nightsOf('2030-01-30', '2030-02-02'), ['2030-01-30', '2030-01-31', '2030-02-01'])
})

test('weekend detection (Fri, Sat nights)', () => {
  assert.equal(isWeekendNight('2030-01-04'), true)
  assert.equal(isWeekendNight('2030-01-05'), true)
  assert.equal(isWeekendNight('2030-01-06'), false)
})

test('computePricing: base, weekend, services, charges, tax, advance', () => {
  const p = computePricing({ accommodation: acc, checkIn: '2030-01-03', checkOut: '2030-01-06', adults: 2, children: 1, serviceIds: ['breakfast', 'bonfire', 'bonfire'], booking, tax })
  assert.equal(p.nights, 3)
  assert.equal(p.baseAmount, 34000)
  assert.equal(p.servicesAmount, 7550)
  assert.equal(p.subtotal, 41550)
  assert.equal(p.serviceCharge, 2077.5)
  assert.equal(p.taxAmount, 5355.3)
  assert.equal(p.totalAmount, 49982.8)
  assert.equal(p.advanceAmount, 14994.84)
})

test('computePricing rejects unknown services', () => {
  assert.throws(() => computePricing({ accommodation: acc, checkIn: '2030-01-03', checkOut: '2030-01-04', adults: 1, children: 0, serviceIds: ['spa'], booking, tax }), /no longer available/)
})

test('validateStay rules', () => {
  const ok = { checkIn: plusDays(5), checkOut: plusDays(7), adults: 2, children: 0, accommodation: acc, booking }
  assert.equal(validateStay(ok), 2)
  assert.throws(() => validateStay({ ...ok, checkIn: plusDays(-1) }), /past/)
  assert.throws(() => validateStay({ ...ok, checkOut: ok.checkIn }), /after check-in/)
  assert.throws(() => validateStay({ ...ok, adults: 3, children: 2 }), /up to 4 guests/)
  assert.throws(() => validateStay({ ...ok, checkOut: plusDays(25) }), /Maximum stay/)
  assert.throws(() => validateStay({ ...ok, booking: { ...booking, minNights: 3 } }), /Minimum stay/)
  assert.throws(() => validateStay({ ...ok, checkIn: plusDays(400), checkOut: plusDays(401) }), /in advance/)
  assert.throws(() => validateStay({ ...ok, checkIn: '2030-02-30' }), /valid/)
})

test('Razorpay signatures', () => {
  const sig = createHmac('sha256', 's').update('order_1|pay_1').digest('hex')
  assert.equal(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: sig, secret: 's' }), true)
  assert.equal(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_2', signature: sig, secret: 's' }), false)
  const body = Buffer.from('{"event":"payment.captured"}')
  assert.equal(verifyWebhookSignature(body, createHmac('sha256', 'wh').update(body).digest('hex'), 'wh'), true)
  assert.equal(verifyWebhookSignature(body, 'bad', 'wh'), false)
})

test('paise conversion & payment status', () => {
  assert.equal(toPaise(14994.84), 1499484)
  assert.equal(derivePaymentStatus({ totalAmount: 100, amountPaid: 0 }), 'unpaid')
  assert.equal(derivePaymentStatus({ totalAmount: 100, amountPaid: 30 }), 'partially_paid')
  assert.equal(derivePaymentStatus({ totalAmount: 100, amountPaid: 100 }), 'paid')
  assert.equal(derivePaymentStatus({ totalAmount: 100, amountPaid: 100, amountRefunded: 40 }), 'partially_refunded')
  assert.equal(derivePaymentStatus({ totalAmount: 100, amountPaid: 100, amountRefunded: 100 }), 'refunded')
})
