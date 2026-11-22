import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/common/Field'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Spinner } from '@/components/common/Primitives'
import { Seo } from '@/components/common/Seo'
import { resetSchema } from '@/validations/schemas'
import { confirmReset } from '@/services/auth/authService'
import { AuthShell } from './AuthShell'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) })

  const onSubmit = async ({ password }) => {
    try {
      await confirmReset(token, password)
      toast.success('Password updated. Please sign in.')
      navigate('/login', { replace: true })
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <AuthShell title="Choose a new password" footer={<Link to="/forgot-password" className="font-semibold text-primary hover:underline">Request a new link</Link>}>
      <Seo title="Reset password" noindex />
      {!token ? (
        <p className="rounded-2xl bg-destructive/5 p-6 text-sm text-destructive">This reset link is missing its token. Please request a new one.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="New password" error={errors.password} hint="At least 8 characters, with a letter and a number."><PasswordInput autoComplete="new-password" {...register('password')} /></Field>
          <Field label="Confirm password" error={errors.confirmPassword}><PasswordInput autoComplete="new-password" {...register('confirmPassword')} /></Field>
          <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="size-4 text-current" />} Update password</Button>
        </form>
      )}
    </AuthShell>
  )
}
