import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import authRoutes from './routes/auth.routes.js'
import publicRoutes from './routes/public.routes.js'
import bookingRoutes from './routes/booking.routes.js'
import paymentRoutes, { razorpayWebhook } from './routes/payment.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
    credentials: true, // refresh-token cookie
  }))
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }))

  // Webhook needs the raw body for signature verification — register before express.json()
  app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook)

  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))
  app.use('/api/auth', authRoutes)
  app.use('/api/bookings', bookingRoutes)
  app.use('/api/payments', paymentRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api', publicRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
