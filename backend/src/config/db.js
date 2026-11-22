import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

export async function connectDB(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, autoIndex: true })
  // Ensure unique indexes (night locks!) exist before serving traffic
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()))
  console.log(`✔ MongoDB connected (${mongoose.connection.name})`)
  return mongoose.connection
}

export async function disconnectDB() {
  await mongoose.disconnect()
}

/** GridFS bucket for uploaded media (images/videos live in MongoDB Atlas). */
let bucket
export function mediaBucket() {
  bucket ??= new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' })
  return bucket
}
export const resetBucket = () => { bucket = undefined }
