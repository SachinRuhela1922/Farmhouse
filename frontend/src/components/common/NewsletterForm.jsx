import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { newsletterSchema } from '@/validations/schemas'
import { subscribeNewsletter } from '@/services/content/contentService'
import { Spinner } from './Primitives'

export function NewsletterForm({ dark = false, className }) {
  const [done, setDone] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(newsletterSchema) })

  const onSubmit = async ({ email }) => {
    try {
      const r = await subscribeNewsletter(email)
      toast.success(r === 'exists' ? 'You are already subscribed — thank you!' : 'Subscribed! Watch your inbox for seasonal offers.')
      setDone(true)
      reset()
    } catch (e) {
      toast.error(e.message || 'Could not subscribe right now.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('w-full', className)} noValidate>
      <div className={cn('flex items-center gap-2 rounded-full p-1.5 pl-5 ring-1 transition focus-within:ring-2', dark ? 'bg-white/5 ring-white/15 focus-within:ring-white/40' : 'bg-white ring-border focus-within:ring-ring')}>
        <label htmlFor={`nl-${dark}`} className="sr-only">Email address</label>
        <input
          id={`nl-${dark}`}
          type="email"
          placeholder="Your email address"
          autoComplete="email"
          {...register('email')}
          className={cn('min-w-0 flex-1 bg-transparent text-sm outline-none', dark ? 'text-white placeholder:text-white/45' : 'placeholder:text-muted-foreground')}
        />
        <button disabled={isSubmitting} className={cn('inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition', dark ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-primary-foreground hover:bg-primary/90')}>
          {isSubmitting ? <Spinner className="size-4 text-current" /> : done ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
          <span className="hidden sm:inline">Subscribe</span>
        </button>
      </div>
      {errors.email && <p className={cn('mt-2 pl-5 text-xs', dark ? 'text-rose-300' : 'text-destructive')}>{errors.email.message}</p>}
    </form>
  )
}
