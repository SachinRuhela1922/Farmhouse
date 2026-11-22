/** Centralised, validated environment configuration. */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Always load backend/.env, no matter which folder or tool starts the server
 * (npm script, `node src/server.js`, IDE run button, nodemon…).
 * Variables already set in the real environment are never overridden. Skipped in tests.
 */
export const ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url))
export const envFileLoaded = process.env.NODE_ENV !== 'test' && existsSync(ENV_FILE)
if (envFileLoaded) {
  try { process.loadEnvFile(ENV_FILE) } catch (e) { console.warn(`⚠ Could not read ${ENV_FILE}: ${e.message}`) }
}

const bool = (v, d = false) => (v == null || v === '' ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase()))
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean)

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 5000),

  mongoUri: process.env.MONGODB_URI || '',

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),

  clientUrls: list(process.env.CLIENT_URL || 'http://localhost:5173'),
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax', // set "none" when frontend & API are on different domains
  cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),

  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  runJobs: bool(process.env.RUN_JOBS, true),
}

export function assertEnv() {
  const missing = []
  if (!env.mongoUri) missing.push('MONGODB_URI')
  if (!env.jwtAccessSecret || env.jwtAccessSecret.length < 32) missing.push('JWT_ACCESS_SECRET (min 32 chars)')
  if (!env.jwtRefreshSecret || env.jwtRefreshSecret.length < 32) missing.push('JWT_REFRESH_SECRET (min 32 chars)')
  if (missing.length) {
    console.error(`\n✖ Missing/invalid environment variables:\n  - ${missing.join('\n  - ')}\n  Copy backend/.env.example to backend/.env and fill them in.\n`)
    process.exit(1)
  }
}
