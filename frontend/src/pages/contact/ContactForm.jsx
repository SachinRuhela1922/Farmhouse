import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/common/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/common/Primitives'
import { contactSchema } from '@/validations/schemas'
import { submitContact } from '@/services/content/contentService'
import { useAuth } from '@/context/AuthContext'

export function ContactForm() {
  const { profile, user } = useAuth()
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
    values: { name: profile?.fullName || '', email: user?.email || '', phone: profile?.phone || '', subject: '', message: '' },
    resetOptions: { keepDirtyValues: true },
  })

  const onSubmit = async (data) => {
    try {
      await submitContact(data)
      setSent(true)
      reset()
      toast.success('Message sent — we’ll be in touch shortly.')
    } catch (e) {
      toast.error(e.message || 'Could not send your message. Please try again.')
    }
  }

  if (sent)
    return (
      <div className="flex h-full flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h3 className="mt-4 text-3xl">Thank you!</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">Your message has reached our team. We usually reply within a few hours.</p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSent(false)}>Send another message</Button>
      </div>
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Full name" error={errors.name}><Input autoComplete="name" {...register('name')} /></Field>
      <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" {...register('email')} /></Field>
      <Field label="Phone (optional)" error={errors.phone}><Input type="tel" autoComplete="tel" {...register('phone')} /></Field>
      <Field label="Subject" error={errors.subject}><Input placeholder="Weekend stay, birthday, offsite…" {...register('subject')} /></Field>
      <Field label="Message" error={errors.message} className="sm:col-span-2"><Textarea rows={5} placeholder="Tell us your dates, group size and occasion" {...register('message')} /></Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-full sm:w-auto sm:px-10">
          {isSubmitting && <Spinner className="size-4 text-current" />} Send message
        </Button>
      </div>
    </form>
  )
}
