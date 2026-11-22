#!/usr/bin/env node
/**
 * Demo data for trying every screen (bookings in all statuses, payments, customers, enquiries, subscribers).
 *   npm run seed:demo              → install (replaces previous demo data; real data untouched)
 *   npm run seed:demo -- --remove  → delete all demo data
 * All demo records use "@demo.local" emails.
 */
import { env } from '../src/config/env.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { installDemoData, removeDemoData, DEMO_PASSWORD, DEMO_ADMIN } from '../src/services/demoService.js'

if (!env.mongoUri) { console.error('MONGODB_URI is not set (backend/.env).'); process.exit(1) }
await connectDB(env.mongoUri)
if (process.argv.includes('--remove')) {
  console.log('✔ Removed demo data:', await removeDemoData())
} else {
  const r = await installDemoData()
  console.log('✔ Demo data installed:', r)
  console.log(`\n  Demo admin    : ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`)
  console.log(`  Demo customer : riya@demo.local / ${DEMO_PASSWORD}  (all demo customers use this password)`)
  console.log('  Remove later  : npm run seed:demo -- --remove\n')
}
await disconnectDB()
