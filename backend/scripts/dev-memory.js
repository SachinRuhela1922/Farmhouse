#!/usr/bin/env node
/**
 * Run the API against a throw-away in-memory MongoDB replica set — no Atlas account needed.
 * Seeds the starter content and creates a demo admin. Data is lost when the process stops.
 *   npm run dev:memory
 * Demo admin:  admin@demo.local / Admin12345
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

const repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
process.env.MONGODB_URI = repl.getUri('farmhouse_dev')
process.env.JWT_ACCESS_SECRET ||= randomBytes(48).toString('hex')
process.env.JWT_REFRESH_SECRET ||= randomBytes(48).toString('hex')
console.log('✔ In-memory MongoDB started')

const { connectDB } = await import('../src/config/db.js')
const { installStarterContent } = await import('../src/services/seedService.js')
const { User } = await import('../src/models/User.js')
await connectDB(process.env.MONGODB_URI)
console.log('✔ Seeded:', (await installStarterContent()).join(', '))
await User.create({ fullName: 'Demo Admin', email: 'admin@demo.local', phone: '+91 90000 00000', passwordHash: await bcrypt.hash('Admin12345', 12), authProviders: ['password'], role: 'admin', emailVerified: true })
console.log('✔ Demo admin: admin@demo.local / Admin12345')

await import('../src/server.js')
process.on('exit', () => repl.stop())
