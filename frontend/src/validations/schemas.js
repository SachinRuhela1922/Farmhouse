import { z } from 'zod'

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(120)
const phone = z.string().trim().regex(/^\+?[\d\s-]{8,16}$/, 'Enter a valid phone number')
const optionalPhone = z.union([z.literal(''), phone]).optional()
const password = z.string().min(8, 'Use at least 8 characters').max(72).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number')
const name = z.string().trim().min(2, 'Please enter your full name').max(80)

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') })
export const signupSchema = z
  .object({ fullName: name, email, phone, password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
export const forgotSchema = z.object({ email })
export const resetSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
export const profileSchema = z.object({ fullName: name, phone })
export const changePasswordSchema = z
  .object({ currentPassword: z.string().optional(), newPassword: password, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export const newsletterSchema = z.object({ email })
export const contactSchema = z.object({
  name,
  email,
  phone: optionalPhone,
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
})

export const bookingSchema = z
  .object({
    guestName: name,
    email,
    phone,
    accommodationId: z.string().min(1, 'Select an accommodation'),
    checkIn: z.string().min(1, 'Select check-in date'),
    checkOut: z.string().min(1, 'Select check-out date'),
    adults: z.coerce.number().int().min(1, 'At least 1 adult').max(50),
    children: z.coerce.number().int().min(0).max(30),
    services: z.array(z.string()).default([]),
    specialRequests: z.string().trim().max(1000).optional(),
    acceptPolicy: z.literal(true, { message: 'Please accept the booking policy' }),
  })
  .refine((d) => !d.checkIn || !d.checkOut || d.checkOut > d.checkIn, { message: 'Check-out must be after check-in', path: ['checkOut'] })

/* ---------------- Admin ---------------- */
const num = (min = 0) => z.coerce.number({ message: 'Enter a number' }).min(min)
export const accommodationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  shortDescription: z.string().trim().max(200).optional(),
  description: z.string().trim().min(10, 'Add a description').max(4000),
  pricePerNight: num(1),
  weekendPrice: z.coerce.number().min(0).optional(),
  capacity: num(1),
  bedrooms: num(0),
  bathrooms: num(0),
  amenities: z.array(z.string()).default([]),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const experienceSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(1000),
  category: z.string().trim().max(40).optional(),
  icon: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const testimonialSchema = z.object({
  guestName: z.string().trim().min(2).max(80),
  location: z.string().trim().max(80).optional(),
  review: z.string().trim().min(10).max(1000),
  rating: z.coerce.number().int().min(1).max(5),
  displayOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(true),
})
export const faqSchema = z.object({
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(5).max(2000),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})
