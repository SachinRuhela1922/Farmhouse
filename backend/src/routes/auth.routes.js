import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validate } from '../utils/http.js'
import { requireAuth } from '../middleware/auth.js'
import * as auth from '../services/authService.js'
import { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllForUser, refreshCookieOptions, REFRESH_COOKIE } from '../services/tokenService.js'
import { User } from '../models/User.js'
import {
  registerSchema, loginSchema, googleSchema, tokenSchema, forgotSchema, resetSchema, profileSchema, changePasswordSchema,
} from '../validations/schemas.js'

const r = Router()
const strict = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many attempts. Please try again in a few minutes.', code: 'resource-exhausted' } } })

/** Issue access token (body) + rotating refresh token (httpOnly cookie). */
async function startSession(res, req, user, status = 200, extra = {}) {
  const refresh = await issueRefreshToken(user, { userAgent: req.get('user-agent') })
  res.cookie(REFRESH_COOKIE, refresh, refreshCookieOptions())
  res.status(status).json({ accessToken: signAccessToken(user), user: user.toJSON(), ...extra })
}

r.post('/register', strict, validate(registerSchema), async (req, res) => {
  const { user, emailDelivery } = await auth.register(req.body)
  await startSession(res, req, user, 201, { emailDelivery })
})

r.post('/login', strict, validate(loginSchema), async (req, res) => {
  const user = await auth.login(req.body)
  await startSession(res, req, user)
})

r.post('/google', strict, validate(googleSchema), async (req, res) => {
  const user = await auth.loginWithGoogle(req.body.idToken)
  await startSession(res, req, user)
})

r.post('/refresh', async (req, res) => {
  const { user, refreshToken } = await rotateRefreshToken(req.cookies?.[REFRESH_COOKIE] || '', req.get('user-agent'))
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({ accessToken: signAccessToken(user), user: user.toJSON() })
})

r.post('/logout', async (req, res) => {
  await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE])
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
  res.json({ ok: true })
})

r.post('/logout-all', requireAuth, async (req, res) => {
  await revokeAllForUser(req.user._id)
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
  res.json({ ok: true })
})

r.post('/verify-email', strict, validate(tokenSchema), async (req, res) => {
  const user = await auth.verifyEmail(req.body.token)
  res.json({ ok: true, user: user.toJSON() })
})

r.post('/resend-verification', strict, requireAuth, async (req, res) => {
  const result = await auth.resendVerification(req.user)
  res.json({ ok: true, emailDelivery: result.status })
})

r.post('/forgot-password', strict, validate(forgotSchema), async (req, res) => {
  await auth.forgotPassword(req.body.email)
  res.json({ ok: true }) // identical response whether or not the account exists
})

r.post('/reset-password', strict, validate(resetSchema), async (req, res) => {
  await auth.resetPassword(req.body.token, req.body.password)
  res.json({ ok: true })
})

/* ---------------- Current user ---------------- */
r.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toJSON() }))

r.patch('/me', requireAuth, validate(profileSchema), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { fullName: req.body.fullName, phone: req.body.phone }, { returnDocument: 'after', runValidators: true })
  res.json({ user: user.toJSON() })
})

r.post('/me/password', strict, requireAuth, validate(changePasswordSchema), async (req, res) => {
  const user = await auth.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword)
  await startSession(res, req, user) // fresh session; all others were revoked
})

export default r
