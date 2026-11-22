/**
 * Firebase is used ONLY for "Continue with Google". The resulting Firebase ID token is
 * sent to our backend, which verifies it and issues its own JWT session. All data lives in MongoDB.
 */
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const isGoogleConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && !String(config.projectId).startsWith('your-'))

let auth
function firebaseAuth() {
  if (!isGoogleConfigured) throw new Error('Google sign-in is not configured.')
  auth ??= getAuth(getApps()[0] ?? initializeApp(config))
  return auth
}

/** Opens the Google popup and returns a Firebase ID token for the backend to verify. */
export async function getGoogleIdToken() {
  const a = firebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(a, provider)
  const idToken = await cred.user.getIdToken()
  // We don't keep a Firebase session — our own JWT session is the source of truth.
  await signOut(a).catch(() => {})
  return idToken
}

export function googleErrorMessage(e) {
  const map = {
    'auth/popup-closed-by-user': null,
    'auth/cancelled-popup-request': null,
    'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Please allow popups and try again.',
    'auth/unauthorized-domain': 'This domain is not authorised for Google sign-in (Firebase → Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase Authentication.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return e?.code in map ? map[e.code] : e?.message || 'Google sign-in failed.'
}
