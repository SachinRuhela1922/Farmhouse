import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/common/Field'
import { Spinner } from '@/components/common/Primitives'
import { Seo } from '@/components/common/Seo'
import { forgotSchema } from '@/validations/schemas'
import { resetPassword, authErrorMessage } from '@/services/auth/authService'
import { AuthShell } from './AuthShell'

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async ({ email }) => {
    try {
      await resetPassword(email)
      setSentTo(email)
    } catch (e) {
      // Don't reveal whether an account exists
      if (e.code === 'auth/user-not-found') setSentTo(email)
      else toast.error(authErrorMessage(e))
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="We’ll email you a secure link to choose a new password." footer={<Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}>
      <Seo title="Reset password" noindex />
      {sentTo ? (
        <div className="rounded-2xl bg-accent/50 p-6 text-center">
          <MailCheck className="mx-auto size-10 text-primary" />
          <p className="mt-4 font-serif text-2xl">Check your inbox</p>
          <p className="mt-2 text-sm text-muted-foreground">If an account exists for <strong>{sentTo}</strong>, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" className="h-11" {...register('email')} /></Field>
          <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="size-4 text-current" />} Send reset link</Button>
        </form>
      )}
    </AuthShell>
  )
}
