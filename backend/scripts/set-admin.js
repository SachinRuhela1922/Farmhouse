#!/usr/bin/env node
/**
 * Grant or revoke the admin role (the only way to create the FIRST admin).
 *   npm run set-admin -- owner@example.com
 *   npm run set-admin -- owner@example.com --revoke
 * The user must already have registered (email/password or Google).
 */
import { env } from '../src/config/env.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'

const [email, flag] = process.argv.slice(2)
if (!email) {
  console.error('Usage: npm run set-admin -- <email> [--revoke]')
  process.exit(1)
}
await connectDB(env.mongoUri)
const user = await User.findOne({ email: email.toLowerCase().trim() })
if (!user) {
  console.error(`✖ No user with email ${email}. Register on the website first.`)
  await disconnectDB()
  process.exit(1)
}
user.role = flag === '--revoke' ? 'customer' : 'admin'
await user.save()
console.log(`✔ ${user.email} is now ${user.role}`)
await disconnectDB()
