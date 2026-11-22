import { env, assertEnv, ENV_FILE, envFileLoaded } from './config/env.js'
import { connectDB, disconnectDB } from './config/db.js'
import { createApp } from './app.js'
import { startJobs } from './jobs/maintenance.js'

console.log(envFileLoaded ? `✔ Env loaded from ${ENV_FILE}` : `⚠ No .env file at ${ENV_FILE} — using process environment only`)
assertEnv()
console.log(`  • Google sign-in : ${env.firebaseProjectId ? `enabled (project ${env.firebaseProjectId})` : 'DISABLED — set FIREBASE_PROJECT_ID'}`)
console.log(`  • Email (SMTP)   : ${env.smtp.host && env.smtp.from ? `enabled (${env.smtp.host})` : 'DISABLED — emails will not be sent'}`)
console.log(`  • Razorpay       : ${env.razorpay.keyId && env.razorpay.keySecret ? 'enabled' : 'DISABLED — online payments off'}`)
await connectDB(env.mongoUri)

const app = createApp()
const server = app.listen(env.port, () => console.log(`✔ API listening on http://localhost:${env.port}`))
if (env.runJobs) startJobs()

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down`)
  server.close(async () => {
    await disconnectDB()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
