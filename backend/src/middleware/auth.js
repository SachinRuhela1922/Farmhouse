import { verifyAccessToken } from '../services/tokenService.js'
import { User } from '../models/User.js'
import { forbidden, unauthorized } from '../utils/http.js'

/**
 * Authenticate via `Authorization: Bearer <access JWT>`.
 * The user is re-loaded from MongoDB on every request so role changes and
 * deactivations take effect immediately (the token's role claim is never trusted alone).
 */
async function resolveUser(req) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (e) {
    throw unauthorized(e.name === 'TokenExpiredError' ? 'Session expired.' : 'Invalid session.')
  }
  const user = await User.findById(payload.sub)
  if (!user || !user.isActive) throw unauthorized('Account not found or disabled.')
  return user
}

export const requireAuth = async (req, _res, next) => {
  try {
    const user = await resolveUser(req)
    if (!user) throw unauthorized()
    req.user = user
    next()
  } catch (e) {
    next(e)
  }
}

export const optionalAuth = async (req, _res, next) => {
  try {
    req.user = await resolveUser(req)
    next()
  } catch {
    req.user = null
    next()
  }
}

export const requireAdmin = [
  requireAuth,
  (req, _res, next) => (req.user.role === 'admin' ? next() : next(forbidden('Administrator access required.'))),
]
