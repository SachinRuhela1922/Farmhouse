import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/common/Field'
import { PasswordInput } from '@/components/common/PasswordInput'
import { GoogleButton } from '@/components/common/GoogleButton'
import { Spinner } from '@/components/common/Primitives'
import { Seo } from '@/components/common/Seo'
import { loginSchema } from '@/validations/schemas'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from './AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) })
  const done = (res) => {
    toast.success(`Welcome back, ${res.user.fullName.split(' ')[0]}!`)
    navigate(location.state?.from || (res.user.role === 'admin' ? '/admin' : '/account/bookings'), { replace: true })
  }

  const onSubmit = async (data) => {
    try { done(await login(data)) } catch (e) { toast.error(e.message) }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your bookings." footer={<>New here? <Link to="/signup" state={location.state} className="font-semibold text-primary hover:underline">Create an account</Link></>}>
      <Seo title="Sign in" noindex />
      <GoogleButton onSuccess={done} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" className="h-11" {...register('email')} /></Field>
        <Field label="Password" error={errors.password}><PasswordInput autoComplete="current-password" {...register('password')} /></Field>
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
        <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="size-4 text-current" />} Sign in</Button>
      </form>
    </AuthShell>
  )
}
