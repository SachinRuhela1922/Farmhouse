import mongoose from 'mongoose'
import { cleanJSON } from './plugins.js'

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    passwordHash: { type: String, select: false },
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: { type: String, default: '' },
    authProviders: { type: [String], default: [] }, // 'password' | 'google'
    // Role is ONLY changed server-side (set-admin script / admin API). Never accepted from signup.
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // One-time tokens are stored hashed
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    // Bumping this invalidates every refresh token for the user (logout-all / password change)
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
)
cleanJSON(userSchema, { hide: ['passwordHash', 'emailVerifyTokenHash', 'emailVerifyExpires', 'resetTokenHash', 'resetExpires', 'tokenVersion'] })

export const User = mongoose.models.User || mongoose.model('User', userSchema)
