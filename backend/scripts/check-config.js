#!/usr/bin/env node
/**
 * Diagnose configuration WITHOUT starting the server or sending any email.
 *   npm run check
 * Checks: .env loading, MongoDB connection, Google (Firebase) token verification, SMTP login, Razorpay keys.
 */
import nodemailer from 'nodemailer'
import mongoose from 'mongoose'
import { env, envFileLoaded, ENV_FILE } from '../src/config/env.js'
import { firebaseAuth } from '../src/config/firebase.js'

const ok = (m) => console.log(`  ✔ ${m}`)
const bad = (m) => console.log(`  ✖ ${m}`)

console.log(`\n.env file: ${envFileLoaded ? ENV_FILE : 'NOT FOUND — ' + ENV_FILE}`)

console.log('\nMongoDB')
if (!env.mongoUri) bad('MONGODB_URI is empty')
else {
  if (!/mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(env.mongoUri)) bad('MONGODB_URI has no database name — data will go to the "test" database. Add /farmhouse?retryWrites=true&w=majority')
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
    ok(`connected (database: ${mongoose.connection.name})`)
    await mongoose.disconnect()
  } catch (e) {
    bad(`cannot connect: ${e.message.split('\n')[0]}  (check password & Atlas → Network Access IP allow-list)`)
  }
}

console.log('\nGoogle sign-in (Firebase)')
const fa = firebaseAuth()
if (!fa) bad('FIREBASE_PROJECT_ID is empty → /api/auth/google returns 412')
else {
  try { await fa.verifyIdToken('not-a-real-token') } catch (e) {
    if (e.code === 'auth/argument-error') ok(`token verification active (project ${env.firebaseProjectId})`)
    else bad(`unexpected: ${e.code || e.message}`)
  }
}

console.log('\nEmail (SMTP)')
if (!env.smtp.host || !env.smtp.from) bad('SMTP_HOST / MAIL_FROM empty → emails are NOT sent')
else {
  try {
    await nodemailer.createTransport({ host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure, auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined, connectionTimeout: 15000 }).verify()
    ok(`login OK as ${env.smtp.user} via ${env.smtp.host}:${env.smtp.port} (no email sent)`)
    if (env.smtp.host.includes('gmail') && !env.smtp.from.includes(env.smtp.user)) bad(`MAIL_FROM should use your Gmail address (${env.smtp.user}) or Gmail may rewrite/reject it`)
  } catch (e) {
    bad(`login failed: ${e.code || ''} ${e.response || e.message}`)
  }
}

console.log('\nRazorpay')
env.razorpay.keyId && env.razorpay.keySecret ? ok('keys present') : bad('not configured (online payments disabled)')
console.log('')
process.exit(0)
