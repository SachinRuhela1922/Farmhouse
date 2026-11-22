import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { env } from './env.js'

/**
 * Firebase is used ONLY to verify Google sign-in ID tokens.
 * verifyIdToken needs just the project id (Google's public keys are fetched automatically) —
 * no service-account credentials are required.
 */
let auth
export function firebaseAuth() {
  if (!env.firebaseProjectId) return null
  if (!auth) {
    const app = getApps()[0] ?? initializeApp({ projectId: env.firebaseProjectId })
    auth = getAuth(app)
  }
  return auth
}
