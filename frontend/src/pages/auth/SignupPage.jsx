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
import { signupSchema } from '@/validations/schemas'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from './AuthShell'

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signup } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(signupSchema) })
  const next = location.state?.from || '/account'

  const onSubmit = async ({ confirmPassword: _c, ...data }) => {
    try {
      const res = await signup(data)
      toast.success(res.emailDelivery === 'sent' ? 'Account created! Check your inbox to verify your email.' : 'Account created!')
      navigate(next, { replace: true })
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Book faster, track requests and manage your stays." footer={<>Already have an account? <Link to="/login" state={location.state} className="font-semibold text-primary hover:underline">Sign in</Link></>}>
      <Seo title="Create account" noindex />
      <GoogleButton label="Sign up with Google" onSuccess={() => { toast.success('Welcome!'); navigate(next, { replace: true }) }} />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
        <Field label="Full name" error={errors.fullName}><Input autoComplete="name" className="h-11" {...register('fullName')} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" className="h-11" {...register('email')} /></Field>
          <Field label="Phone" error={errors.phone}><Input type="tel" autoComplete="tel" className="h-11" {...register('phone')} /></Field>
        </div>
        <Field label="Password" error={errors.password} hint="At least 8 characters, with a letter and a number."><PasswordInput autoComplete="new-password" {...register('password')} /></Field>
        <Field label="Confirm password" error={errors.confirmPassword}><PasswordInput autoComplete="new-password" {...register('confirmPassword')} /></Field>
        <Button type="submit" size="lg" className="mt-2 h-12 w-full rounded-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="size-4 text-current" />} Create account</Button>
      </form>
    </AuthShell>
  )
}
