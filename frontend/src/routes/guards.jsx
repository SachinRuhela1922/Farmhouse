import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FullPageLoader } from '@/components/common/Primitives'

/** Requires a signed-in user. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/**
 * Requires the `admin` custom claim. This is UX only — every admin read/write is
 * independently enforced by Firestore/Storage rules and Cloud Functions.
 */
export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ denied: true }} />
  return <Outlet />
}

/** Redirect signed-in users away from login/signup. */
export function GuestOnlyRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={location.state?.from || '/account/bookings'} replace />
  return <Outlet />
}
