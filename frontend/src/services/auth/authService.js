import { api, setAccessToken, refreshSession } from '../api/client'
import { getGoogleIdToken } from '../firebase/config'

/**
 * Non-sensitive hint ("this browser has signed in before") so we only try to restore a
 * session when one may exist — avoids a pointless 401 from /auth/refresh for every visitor.
 * The actual credential stays in the httpOnly cookie.
 */
const HINT = 'fh_session'
const setHint = (on) => { try { on ? localStorage.setItem(HINT, '1') : localStorage.removeItem(HINT) } catch { /* private mode */ } }
const hasHint = () => { try { return localStorage.getItem(HINT) === '1' } catch { return true } }
export const clearSessionHint = () => setHint(false)

const startSession = (res) => {
  setAccessToken(res.accessToken)
  setHint(true)
  return res
}

export const signup = (data) => api.post('/auth/register', data).then(startSession)
export const login = (data) => api.post('/auth/login', data).then(startSession)
export async function loginWithGoogle() {
  const idToken = await getGoogleIdToken()
  return api.post('/auth/google', { idToken }).then(startSession)
}
export async function logout() {
  await api.post('/auth/logout').catch(() => {})
  setAccessToken(null)
  setHint(false)
}
export async function restoreSession() {
  if (!hasHint()) throw new Error('No previous session')
  try {
    return await refreshSession()
  } catch (e) {
    if (e.status === 401) setHint(false)
    throw e
  }
}
export const fetchMe = () => api.get('/auth/me')
export const resetPassword = (email) => api.post('/auth/forgot-password', { email })
export const confirmReset = (token, password) => api.post('/auth/reset-password', { token, password })
export const verifyEmail = (token) => api.post('/auth/verify-email', { token })
export const resendVerification = () => api.post('/auth/resend-verification')
export const updateMyProfile = (data) => api.patch('/auth/me', data)
export const changePassword = (currentPassword, newPassword) => api.post('/auth/me/password', { currentPassword, newPassword }).then(startSession)

export const authErrorMessage = (e) => e?.message || 'Something went wrong.'
