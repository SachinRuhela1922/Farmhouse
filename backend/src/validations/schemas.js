import { z } from 'zod'

export const emailField = z.string().trim().toLowerCase().min(3).max(120).email('Enter a valid email address')
export const phoneField = z.string().trim().regex(/^\+?[\d\s-]{8,16}$/, 'Enter a valid phone number')
const optionalPhone = z.union([z.literal(''), phoneField]).optional().default('')
export const passwordField = z.string().min(8, 'Use at least 8 characters').max(72).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number')
const nameField = z.string().trim().min(2, 'Please enter your full name').max(80)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id')

/* ---------------- Auth ---------------- */
export const registerSchema = z.object({ fullName: nameField, email: emailField, phone: phoneField, password: passwordField }).strict()
export const loginSchema = z.object({ email: emailField, password: z.string().min(1, 'Password is required').max(200) })
export const googleSchema = z.object({ idToken: z.string().min(20).max(5000) })
export const tokenSchema = z.object({ token: z.string().min(20).max(200) })
export const forgotSchema = z.object({ email: emailField })
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: passwordField })
export const profileSchema = z.object({ fullName: nameField, phone: optionalPhone })
export const changePasswordSchema = z.object({ currentPassword: z.string().max(200).optional().default(''), newPassword: passwordField })

/* ---------------- Public ---------------- */
export const contactSchema = z.object({
  name: nameField, email: emailField, phone: optionalPhone,
  subject: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
})
export const newsletterSchema = z.object({ email: emailField })

/* ---------------- Bookings ---------------- */
export const stayFields = {
  accommodationId: objectId,
  checkIn: isoDate,
  checkOut: isoDate,
  adults: z.coerce.number().int().min(1).max(50),
  children: z.coerce.number().int().min(0).max(30).default(0),
  services: z.array(z.string().max(60)).max(20).default([]),
}
export const quoteSchema = z.object(stayFields)
export const bookingSchema = z.object({
  ...stayFields,
  guestName: nameField,
  email: emailField,
  phone: phoneField,
  specialRequests: z.string().trim().max(1000).optional().default(''),
})
export const cancelSchema = z.object({ reason: z.string().trim().max(500).optional().default('') })
export const adminBookingUpdateSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled', 'completed']).optional(),
  paymentStatus: z.enum(['unpaid', 'partially_paid', 'paid', 'refund_pending', 'refunded', 'partially_refunded']).optional(),
  note: z.string().trim().max(500).optional().default(''),
})

/* ---------------- Payments ---------------- */
export const orderSchema = z.object({ bookingId: z.string().min(5).max(40), mode: z.enum(['advance', 'full']).default('full') })
export const verifySchema = z.object({
  bookingId: z.string().min(5).max(40),
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
})
export const refundSchema = z.object({ paymentId: objectId, amount: z.coerce.number().positive().max(1e8) })
export const offlineSchema = z.object({
  amount: z.coerce.number().positive().max(1e8),
  method: z.enum(['cash', 'bank_transfer', 'upi', 'card_terminal']).default('cash'),
  reference: z.string().trim().max(100).optional().default(''),
})

/* ---------------- Admin content ---------------- */
const image = z.object({ url: z.string().min(1).max(1000), mediaId: z.string().max(40).optional() })
const order = z.coerce.number().int().min(0).max(100000).default(0)

export const contentSchemas = {
  accommodations: z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().max(80).optional(),
    shortDescription: z.string().trim().max(200).optional().default(''),
    description: z.string().trim().min(10).max(4000),
    pricePerNight: z.coerce.number().min(1).max(1e7),
    weekendPrice: z.coerce.number().min(0).max(1e7).optional().default(0),
    capacity: z.coerce.number().int().min(1).max(500),
    bedrooms: z.coerce.number().int().min(0).max(100).default(1),
    bathrooms: z.coerce.number().int().min(0).max(100).default(1),
    amenities: z.array(z.string().trim().max(40)).max(60).default([]),
    images: z.array(image).min(1, 'Add at least one image').max(20),
    displayOrder: order,
    isActive: z.boolean().default(true),
  }),
  experiences: z.object({
    title: z.string().trim().min(2).max(80),
    description: z.string().trim().min(5).max(1000),
    category: z.string().trim().max(40).optional().default(''),
    icon: z.string().max(40).optional().default('Leaf'),
    image: z.string().min(1, 'Add an image').max(1000),
    mediaId: z.string().max(40).optional(),
    price: z.coerce.number().min(0).max(1e7).default(0),
    displayOrder: order,
    isActive: z.boolean().default(true),
  }),
  gallery: z.object({
    type: z.enum(['image', 'video']).default('image'),
    imageUrl: z.string().min(1).max(1000),
    mediaId: z.string().max(40).optional(),
    category: z.string().trim().max(40).default('Uncategorised'),
    title: z.string().trim().max(100).optional().default(''),
    displayOrder: order,
    isActive: z.boolean().default(true),
  }),
  testimonials: z.object({
    guestName: z.string().trim().min(2).max(80),
    location: z.string().trim().max(80).optional().default(''),
    review: z.string().trim().min(10).max(1000),
    rating: z.coerce.number().int().min(1).max(5),
    displayOrder: order,
    isPublished: z.boolean().default(true),
  }),
  faqs: z.object({
    question: z.string().trim().min(5).max(200),
    answer: z.string().trim().min(5).max(2000),
    displayOrder: order,
    isActive: z.boolean().default(true),
  }),
}
export const reorderSchema = z.object({ ids: z.array(objectId).min(1).max(500) })
export const statusSchema = (values) => z.object({ status: z.enum(values) })
export const setAdminSchema = z.object({ email: emailField, admin: z.boolean() })
export const settingsSchema = z.record(z.string(), z.unknown()).refine((o) => JSON.stringify(o).length < 200_000, 'Settings payload too large')
