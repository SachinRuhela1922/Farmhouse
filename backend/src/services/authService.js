import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { firebaseAuth } from '../config/firebase.js'
import { getSettings } from './settingsService.js'
import { sendEmail, templates, appUrl } from './emailService.js'
import { randomToken, sha256, revokeAllForUser } from './tokenService.js'
import { badRequest, conflict, precondition, unauthorized } from '../utils/http.js'

const BCRYPT_ROUNDS = 12
// Timing defence: compare against a real dummy hash when the user doesn't exist
let dummy
const dummyHash = () => (dummy ??= bcrypt.hashSync('not-a-real-password-0', BCRYPT_ROUNDS))

async function sendVerification(user) {
  const token = randomToken()
  await User.updateOne({ _id: user._id }, { emailVerifyTokenHash: sha256(token), emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000) })
  const link = appUrl(`/verify-email?token=${token}`)
  const s = await getSettings()
  return sendEmail({ ...templates.verifyEmail(s.businessName, user.fullName, link), to: user.email, devLink: link })
}

export async function register({ fullName, email, phone, password }) {
  if (await User.exists({ email })) throw conflict('An account with this email already exists.')
  // role is never taken from input — always "customer"
  const user = await User.create({ fullName, email, phone, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS), authProviders: ['password'], role: 'customer' })
  const delivery = await sendVerification(user)
  return { user, emailDelivery: delivery.status }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash')
  const ok = await bcrypt.compare(password, user?.passwordHash || dummyHash())
  if (!user || !user.passwordHash || !ok) {
    if (user && !user.passwordHash) throw unauthorized('This account uses Google sign-in. Continue with Google, or reset your password to add one.')
    throw unauthorized('Incorrect email or password.')
  }
  if (!user.isActive) throw unauthorized('This account has been disabled.')
  user.lastLoginAt = new Date()
  await user.save()
  return user
}

/** Google sign-in: verify the Firebase ID token server-side, then link/create the local user. */
export async function loginWithGoogle(idToken) {
  const fa = firebaseAuth()
  if (!fa) throw precondition('Google sign-in is not configured on the server (FIREBASE_PROJECT_ID).')
  let decoded
  try {
    decoded = await fa.verifyIdToken(idToken)
  } catch {
    throw unauthorized('Google sign-in failed. Please try again.')
  }
  if (decoded.firebase?.sign_in_provider !== 'google.com') throw unauthorized('Unsupported sign-in provider.')
  const email = String(decoded.email || '').toLowerCase()
  if (!email || decoded.email_verified !== true) throw unauthorized('Your Google account email is not verified.')

  let user = await User.findOne({ $or: [{ googleId: decoded.uid }, { email }] })
  if (user) {
    if (!user.isActive) throw unauthorized('This account has been disabled.')
    user.googleId ||= decoded.uid
    if (!user.authProviders.includes('google')) user.authProviders.push('google')
    user.emailVerified = true // Google has verified ownership of this email
    if (!user.avatarUrl && decoded.picture) user.avatarUrl = decoded.picture
  } else {
    user = new User({ fullName: decoded.name || email.split('@')[0], email, googleId: decoded.uid, avatarUrl: decoded.picture || '', emailVerified: true, authProviders: ['google'], role: 'customer' })
  }
  user.lastLoginAt = new Date()
  await user.save()
  return user
}

export async function verifyEmail(token) {
  const user = await User.findOne({ emailVerifyTokenHash: sha256(token), emailVerifyExpires: { $gt: new Date() } })
  if (!user) throw badRequest('This verification link is invalid or has expired.')
  user.emailVerified = true
  user.emailVerifyTokenHash = undefined
  user.emailVerifyExpires = undefined
  await user.save()
  return user
}

export async function resendVerification(user) {
  if (user.emailVerified) return { status: 'already_verified' }
  return sendVerification(user)
}

/** Always resolves (never reveals whether the email exists). */
export async function forgotPassword(email) {
  const user = await User.findOne({ email, isActive: true })
  if (!user) return
  const token = randomToken()
  user.resetTokenHash = sha256(token)
  user.resetExpires = new Date(Date.now() + 3600 * 1000)
  await user.save()
  const link = appUrl(`/reset-password?token=${token}`)
  const s = await getSettings()
  await sendEmail({ ...templates.resetPassword(s.businessName, link), to: user.email, devLink: link })
}

export async function resetPassword(token, password) {
  const user = await User.findOne({ resetTokenHash: sha256(token), resetExpires: { $gt: new Date() } })
  if (!user) throw badRequest('This reset link is invalid or has expired.')
  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  if (!user.authProviders.includes('password')) user.authProviders.push('password')
  user.emailVerified = true // they proved inbox ownership
  user.resetTokenHash = undefined
  user.resetExpires = undefined
  await user.save()
  await revokeAllForUser(user._id) // sign out other sessions
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash')
  if (user.passwordHash && !(await bcrypt.compare(currentPassword || '', user.passwordHash))) throw badRequest('Your current password is incorrect.')
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  if (!user.authProviders.includes('password')) user.authProviders.push('password')
  await user.save()
  await revokeAllForUser(user._id)
  return user
}
