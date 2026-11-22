import { NavLink, Outlet } from 'react-router-dom'
import { MailWarning } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { resendVerification } from '@/services/auth/authService'
import { cn } from '@/lib/utils'

export default function AccountLayout() {
  const { profile, user, emailVerified, refreshUser } = useAuth()
  return (
    <div className="bg-cream/50 pt-32 pb-20 sm:pt-36">
      <div className="container-lux">
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 text-5xl">Hello, {(profile?.fullName || user?.displayName || 'guest').split(' ')[0]}</h1>
        {!emailVerified && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2"><MailWarning className="size-4 shrink-0" /> Please verify {user?.email} to make bookings.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => resendVerification().then((r) => (r.emailDelivery === 'sent' ? toast.success('Verification email sent') : toast.warning('Email sending is not configured on the server yet.'))).catch((e) => toast.error(e.message))}>Resend email</Button>
              <Button size="sm" variant="ghost" onClick={() => refreshUser()}>Refresh</Button>
            </div>
          </div>
        )}
        <nav className="mt-8 flex gap-1 border-b" aria-label="Account">
          {[['/account', 'Profile', true], ['/account/bookings', 'My bookings']].map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('-mb-px border-b-2 px-4 py-3 text-sm font-medium transition', isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8"><Outlet /></div>
      </div>
    </div>
  )
}
