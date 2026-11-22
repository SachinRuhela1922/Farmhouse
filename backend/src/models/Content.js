import mongoose from 'mongoose'
import { cleanJSON } from './plugins.js'

const { Schema } = mongoose
const image = new Schema({ url: { type: String, required: true }, mediaId: String }, { _id: false })

const accommodationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, maxlength: 200, default: '' },
    description: { type: String, required: true, maxlength: 4000 },
    pricePerNight: { type: Number, required: true, min: 1 },
    weekendPrice: { type: Number, min: 0, default: 0 },
    capacity: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, min: 0, default: 1 },
    bathrooms: { type: Number, min: 0, default: 1 },
    amenities: { type: [String], default: [] },
    images: { type: [image], default: [] },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

const experienceSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 1000 },
    category: { type: String, maxlength: 40, default: '' },
    icon: { type: String, default: 'Leaf' },
    image: { type: String, default: '' },
    mediaId: String,
    price: { type: Number, min: 0, default: 0 },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

const gallerySchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    imageUrl: { type: String, required: true },
    mediaId: String,
    category: { type: String, default: 'Uncategorised', maxlength: 40 },
    title: { type: String, default: '', maxlength: 100 },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

const testimonialSchema = new Schema(
  {
    guestName: { type: String, required: true, maxlength: 80 },
    location: { type: String, maxlength: 80, default: '' },
    review: { type: String, required: true, maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    displayOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

const faqSchema = new Schema(
  {
    question: { type: String, required: true, maxlength: 200 },
    answer: { type: String, required: true, maxlength: 2000 },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

const contactSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, maxlength: 120 },
    phone: { type: String, maxlength: 20, default: '' },
    subject: { type: String, maxlength: 120, default: '' },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new', index: true },
  },
  { timestamps: true },
)

const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

/** Single-document CMS settings (key = 'main'). Flexible shape, validated at the route. */
const siteSettingsSchema = new Schema({ key: { type: String, unique: true, default: 'main' }, data: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true, minimize: false })

for (const s of [accommodationSchema, experienceSchema, gallerySchema, testimonialSchema, faqSchema, contactSchema, newsletterSchema, siteSettingsSchema]) cleanJSON(s)

const m = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)
export const Accommodation = m('Accommodation', accommodationSchema)
export const Experience = m('Experience', experienceSchema)
export const Gallery = m('Gallery', gallerySchema)
export const Testimonial = m('Testimonial', testimonialSchema)
export const Faq = m('Faq', faqSchema)
export const Contact = m('Contact', contactSchema)
export const Newsletter = m('Newsletter', newsletterSchema)
export const SiteSettings = m('SiteSettings', siteSettingsSchema)
