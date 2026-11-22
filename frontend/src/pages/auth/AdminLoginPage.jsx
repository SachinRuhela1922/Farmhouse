import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/common/Field'
import { PasswordInput } from '@/components/common/PasswordInput'
import { GoogleButton } from '@/components/common/GoogleButton'
import { Spinner } from '@/components/common/Primitives'
import { Seo } from '@/components/common/Seo'
import { Logo } from '@/components/layout/Logo'
import { loginSchema } from '@/validations/schemas'
import { useAuth } from '@/context/AuthContext'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, login, logout, refreshUser } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) })

  useEffect(() => { if (user && isAdmin) navigate(location.state?.from || '/admin', { replace: true }) }, [user, isAdmin, navigate, location.state])

  const after = async (res) => {
    if (res.user.role !== 'admin') {
      await logout()
      toast.error('This account does not have administrator access.')
    }
  }
  const onSubmit = async (data) => {
    try { await after(await login(data)) } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[oklch(0.96_0.015_85)] p-5">
      <Seo title="Admin sign in" noindex />
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lift ring-1 ring-border/60 sm:p-10">
        <Logo />
        <div className="mt-8 flex items-center gap-2 text-primary"><ShieldCheck className="size-5" /><span className="eyebrow">Administrator</span></div>
        <h1 className="mt-2 text-4xl">Dashboard sign in</h1>
        {user && !isAdmin && (
          <div className="mt-6 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            <ShieldAlert className="size-5 shrink-0" />
            <div>
              You are signed in as <strong>{user.email}</strong>, which is not an administrator.
              <button className="mt-2 block font-semibold underline" onClick={async () => { const r = await refreshUser(); if (r?.user?.role === 'admin') navigate('/admin'); else toast.error('Still no admin access on this account.') }}>Re-check access</button>
            </div>
          </div>
        )}
        <div className="mt-8"><GoogleButton onSuccess={after} /></div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Email" error={errors.email}><Input type="email" autoComplete="username" className="h-11" {...register('email')} /></Field>
          <Field label="Password" error={errors.password}><PasswordInput autoComplete="current-password" {...register('password')} /></Field>
          <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="size-4 text-current" />} Sign in</Button>
        </form>
        <p className="mt-6 text-center text-sm"><Link to="/" className="text-muted-foreground hover:text-foreground">← Back to website</Link></p>
      </div>
    </div>
  )
}
