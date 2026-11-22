import mongoose from 'mongoose'

/** Rotating refresh tokens (stored hashed). Reuse of a revoked token revokes the whole family. */
const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  replacedBy: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
})
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL cleanup

export const RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema)
