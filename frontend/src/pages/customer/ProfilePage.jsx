import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { BadgeCheck, MailWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/common/Field'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Spinner } from '@/components/common/Primitives'
import { Seo } from '@/components/common/Seo'
import { useAuth } from '@/context/AuthContext'
import { profileSchema, changePasswordSchema } from '@/validations/schemas'
import { formatDate } from '@/utils/format'

export default function ProfilePage() {
  const { user, emailVerified, updateProfile, changePassword } = useAuth()
  const hasPassword = user?.authProviders?.includes('password')
  const pf = useForm({ resolver: zodResolver(profileSchema), values: { fullName: user?.fullName || '', phone: user?.phone || '' } })
  // Google-only accounts can set a first password without a current one
  const pw = useForm({ resolver: zodResolver(changePasswordSchema) })

  const saveProfile = async (data) => {
    try { await updateProfile(data); toast.success('Profile updated') } catch (e) { toast.error(e.message) }
  }
  const savePassword = async ({ currentPassword, newPassword }) => {
    if (hasPassword && !currentPassword) return pw.setError('currentPassword', { message: 'Required' })
    try { await changePassword(currentPassword || '', newPassword); pw.reset(); toast.success(hasPassword ? 'Password changed — other devices were signed out' : 'Password added — you can now sign in with email too') } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Seo title="My profile" noindex />
      <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-8">
        <h2 className="text-3xl">Profile details</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {user?.email} {emailVerified ? <span className="inline-flex items-center gap-1 text-emerald-700"><BadgeCheck className="size-4" /> verified</span> : <span className="inline-flex items-center gap-1 text-amber-700"><MailWarning className="size-4" /> not verified</span>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {user?.createdAt && <>Member since {formatDate(user.createdAt, 'MMMM yyyy')} · </>}
          Sign-in: {(user?.authProviders || []).map((p) => (p === 'google' ? 'Google' : 'Email & password')).join(', ')}
        </p>
        <form onSubmit={pf.handleSubmit(saveProfile)} className="mt-6 grid gap-5" noValidate>
          <Field label="Full name" error={pf.formState.errors.fullName}><Input className="h-11" autoComplete="name" {...pf.register('fullName')} /></Field>
          <Field label="Phone" error={pf.formState.errors.phone}><Input className="h-11" type="tel" autoComplete="tel" {...pf.register('phone')} /></Field>
          <Button type="submit" className="justify-self-start rounded-full px-8" disabled={pf.formState.isSubmitting || !pf.formState.isDirty}>{pf.formState.isSubmitting && <Spinner className="size-4 text-current" />} Save changes</Button>
        </form>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-8">
        <h2 className="text-3xl">{hasPassword ? 'Change password' : 'Add a password'}</h2>
        {!hasPassword && <p className="mt-2 text-sm text-muted-foreground">You signed up with Google. Add a password to also sign in with your email.</p>}
        <form onSubmit={pw.handleSubmit(savePassword)} className="mt-6 grid gap-5" noValidate>
          {hasPassword && <Field label="Current password" error={pw.formState.errors.currentPassword}><PasswordInput autoComplete="current-password" {...pw.register('currentPassword')} /></Field>}
          <Field label="New password" error={pw.formState.errors.newPassword}><PasswordInput autoComplete="new-password" {...pw.register('newPassword')} /></Field>
          <Field label="Confirm new password" error={pw.formState.errors.confirmPassword}><PasswordInput autoComplete="new-password" {...pw.register('confirmPassword')} /></Field>
          <Button type="submit" variant="outline" className="justify-self-start rounded-full px-8" disabled={pw.formState.isSubmitting}>{pw.formState.isSubmitting && <Spinner className="size-4" />} {hasPassword ? 'Update password' : 'Add password'}</Button>
        </form>
      </section>
    </div>
  )
}
