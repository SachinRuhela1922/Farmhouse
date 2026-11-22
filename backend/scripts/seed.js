#!/usr/bin/env node
/**
 * Seed MongoDB with the complete starter content (stays, experiences, gallery, testimonials, FAQs, site settings).
 *   npm run seed            → fills only EMPTY collections (safe)
 *   npm run seed -- --reset → wipes content collections & settings, then re-seeds (bookings/users untouched)
 */
import { env } from '../src/config/env.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { installStarterContent } from '../src/services/seedService.js'

if (!env.mongoUri) {
  console.error('MONGODB_URI is not set (backend/.env).')
  process.exit(1)
}
const reset = process.argv.includes('--reset')
await connectDB(env.mongoUri)
const installed = await installStarterContent({ reset })
console.log(installed.length ? `✔ Installed: ${installed.join(', ')}` : '• Nothing to install — collections already contain data (use --reset to re-seed).')
await disconnectDB()
