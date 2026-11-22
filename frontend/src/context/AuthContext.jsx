import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onSessionExpired } from '@/services/api/client'
import * as authApi from '@/services/auth/authService'

const AuthContext = createContext(null)

/**
 * JWT session state. On load we try the httpOnly refresh cookie to restore the session.
 * `user.role` drives UI only — every admin action is re-authorised by the API.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const qc = useQueryClient()

  useEffect(() => {
    let live = true
    authApi.restoreSession().then((r) => live && setUser(r.user)).catch(() => {}).finally(() => live && setLoading(false))
    const off = onSessionExpired(() => { authApi.clearSessionHint(); setUser(null); qc.clear() })
    return () => { live = false; off() }
  }, [qc])

  const apply = useCallback((res) => { setUser(res.user); return res }, [])

  const actions = useMemo(() => ({
    login: (data) => authApi.login(data).then(apply),
    signup: (data) => authApi.signup(data).then(apply),
    loginWithGoogle: () => authApi.loginWithGoogle().then(apply),
    logout: async () => { await authApi.logout(); setUser(null); qc.clear() },
    refreshUser: () => authApi.fetchMe().then(apply).catch(() => null),
    updateProfile: (data) => authApi.updateMyProfile(data).then(apply),
    changePassword: (cur, next) => authApi.changePassword(cur, next).then(apply),
    setUser,
  }), [apply, qc])

  const value = useMemo(() => ({
    user,
    profile: user, // alias kept for components that read profile fields
    loading,
    isAdmin: user?.role === 'admin',
    emailVerified: !!user?.emailVerified,
    ...actions,
  }), [user, loading, actions])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
