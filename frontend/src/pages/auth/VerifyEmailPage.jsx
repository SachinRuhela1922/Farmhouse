import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FullPageLoader } from '@/components/common/Primitives'
import { Seo } from '@/components/common/Seo'
import { verifyEmail } from '@/services/auth/authService'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from './AuthShell'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user, refreshUser } = useAuth()
  const [state, setState] = useState({ status: 'loading', error: '' })
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // tokens are single-use; avoid StrictMode double call
    ran.current = true
    if (!token) { setState({ status: 'error', error: 'This link is missing its security token.' }); return }
    verifyEmail(token)
      .then(() => { setState({ status: 'verified' }); if (user) refreshUser() })
      .catch((e) => setState({ status: 'error', error: e.message }))
  }, [token, user, refreshUser])

  if (state.status === 'loading') return <FullPageLoader />
  const ok = state.status === 'verified'
  return (
    <AuthShell title={ok ? 'Email verified' : 'Link problem'}>
      <Seo title="Verify email" noindex />
      <div className="rounded-2xl bg-white p-8 text-center shadow-soft ring-1 ring-border/50">
        {ok ? <CheckCircle2 className="mx-auto size-12 text-primary" /> : <XCircle className="mx-auto size-12 text-destructive" />}
        <p className="mt-4 text-muted-foreground">{ok ? 'Thank you — your email is verified. You can now complete bookings.' : state.error}</p>
        <Button asChild className="mt-6 rounded-full"><Link to={ok ? '/booking' : user ? '/account' : '/login'}>{ok ? 'Book a stay' : user ? 'Go to my account' : 'Sign in'}</Link></Button>
      </div>
    </AuthShell>
  )
}
