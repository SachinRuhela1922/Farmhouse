import jwt from 'jsonwebtoken'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { env } from '../config/env.js'
import { RefreshToken } from '../models/RefreshToken.js'
import { User } from '../models/User.js'
import { unauthorized } from '../utils/http.js'

export const sha256 = (s) => createHash('sha256').update(s).digest('hex')
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')

export const REFRESH_COOKIE = 'fh_rt'

/** Short-lived access token (sent as Bearer header, kept in memory by the SPA). */
export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtAccessSecret, { expiresIn: env.accessTtl, issuer: 'farmhouse-api', audience: 'farmhouse-web' })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret, { issuer: 'farmhouse-api', audience: 'farmhouse-web', algorithms: ['HS256'] })
}

/**
 * Issue a rotating refresh token (httpOnly cookie). Stored hashed; each use rotates it.
 * Presenting an already-rotated token revokes the entire family (token theft detection).
 */
export async function issueRefreshToken(user, { family = randomUUID(), userAgent } = {}) {
  const tokenVersion = (await User.findById(user._id).select('+tokenVersion').lean())?.tokenVersion ?? 0
  const jti = randomToken(24)
  const token = jwt.sign({ sub: String(user._id), fam: family, v: tokenVersion, jti }, env.jwtRefreshSecret, { expiresIn: `${env.refreshTtlDays}d` })
  await RefreshToken.create({
    user: user._id, tokenHash: sha256(token), family, userAgent: userAgent?.slice(0, 200),
    expiresAt: new Date(Date.now() + env.refreshTtlDays * 86400000),
  })
  return token
}

export async function rotateRefreshToken(token, userAgent) {
  let payload
  try {
    payload = jwt.verify(token, env.jwtRefreshSecret, { algorithms: ['HS256'] })
  } catch {
    throw unauthorized('Session expired. Please sign in again.')
  }
  const stored = await RefreshToken.findOne({ tokenHash: sha256(token) })
  if (!stored) throw unauthorized('Session expired. Please sign in again.')
  if (stored.revokedAt) {
    // Reuse detected → revoke the whole family
    await RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() })
    throw unauthorized('Session expired. Please sign in again.')
  }
  const user = await User.findById(payload.sub).select('+tokenVersion')
  if (!user || !user.isActive || (user.tokenVersion ?? 0) !== payload.v) throw unauthorized('Session expired. Please sign in again.')
  const next = await issueRefreshToken(user, { family: stored.family, userAgent })
  stored.revokedAt = new Date()
  stored.replacedBy = sha256(next)
  await stored.save()
  return { user, refreshToken: next }
}

export async function revokeRefreshToken(token) {
  if (!token) return
  await RefreshToken.updateOne({ tokenHash: sha256(token), revokedAt: null }, { revokedAt: new Date() })
}

export async function revokeAllForUser(userId) {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() })
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } })
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/api/auth',
    maxAge: env.refreshTtlDays * 86400000,
  }
}
