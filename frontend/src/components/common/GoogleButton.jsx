import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { isGoogleConfigured, googleErrorMessage } from '@/services/firebase/config'
import { Spinner } from './Primitives'

const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6H1.4a12 12 0 0 0 0 10.8z" />
    <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
  </svg>
)

/** "Continue with Google" → Firebase popup → backend verifies token → JWT session. */
export function GoogleButton({ onSuccess, label = 'Continue with Google' }) {
  const { loginWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!isGoogleConfigured) return null
  return (
    <>
      <Button type="button" variant="outline" size="lg" className="h-12 w-full rounded-full bg-white" disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            const res = await loginWithGoogle()
            onSuccess?.(res)
          } catch (e) {
            const msg = e?.code?.startsWith?.('auth/') ? googleErrorMessage(e) : e.message
            if (msg) toast.error(msg)
          } finally {
            setBusy(false)
          }
        }}>
        {busy ? <Spinner className="size-4" /> : <GoogleG />} {label}
      </Button>
      <div className="relative my-6 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span className="relative z-10 bg-background px-3">or with email</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>
    </>
  )
}
