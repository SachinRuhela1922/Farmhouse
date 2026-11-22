import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Inbox, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_STYLES } from '@/utils/constants'
import { sized, srcSet } from '@/utils/images'
import { Button } from '@/components/ui/button'

/** Fade/slide-in on scroll. Lightweight and respects reduced-motion via CSS. */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }) {
  const M = motion[as]
  return (
    <M
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </M>
  )
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', className }) {
  return (
    <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="text-4xl leading-[1.05] sm:text-5xl text-balance">{title}</h2>
      {subtitle && <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty">{subtitle}</p>}
    </Reveal>
  )
}

/** Image with lazy-loading, responsive srcset, graceful fallback and fade-in. */
export function Img({ src, alt = '', className, width = 1200, sizes = '100vw', eager = false, ...rest }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!src || failed)
    return <div className={cn('bg-gradient-to-br from-sand to-cream', className)} role="img" aria-label={alt} />
  return (
    <img
      src={sized(src, width)}
      srcSet={srcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn('bg-sand/40 object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', className)}
      {...rest}
    />
  )
}

export function StatusBadge({ status, className }) {
  const s = STATUS_STYLES[status] || { label: status || '—', className: 'bg-stone-100 text-stone-700 ring-stone-200', dot: 'bg-stone-400' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', s.className, className)}>
      <span className="relative flex size-1.5">
        {s.pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', s.dot)} />}
        <span className={cn('relative inline-flex size-1.5 rounded-full', s.dot)} />
      </span>
      {s.label}
    </span>
  )
}

export function EmptyState({ icon: IconC = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 px-6 py-16 text-center', className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-secondary text-primary"><IconC className="size-5" /></div>
      <h3 className="font-serif text-2xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, title = 'Something went wrong', onRetry, className }) {
  const denied = error?.code === 'permission-denied'
  const index = /index/i.test(error?.message || '')
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center', className)}>
      <AlertTriangle className="mb-3 size-6 text-destructive" />
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {denied ? 'You do not have permission to view this content.' : index ? 'A Firestore index is still building or missing. Deploy firestore.indexes.json and retry in a minute.' : error?.message || 'Please try again.'}
      </p>
      {onRetry && <Button variant="outline" className="mt-5" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-primary', className)} />
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-6" />
        <span className="eyebrow text-muted-foreground">Loading</span>
      </div>
    </div>
  )
}

/** Inner-page hero banner. */
export function PageHero({ eyebrow, title, subtitle, image, children }) {
  return (
    <section className="relative isolate overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      {image && (
        <>
          <Img src={image} alt="" eager className="absolute inset-0 -z-20 size-full" width={2000} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/30 to-black/55" />
        </>
      )}
      <div className={cn('container-lux text-center', image ? 'text-white' : '')}>
        <Reveal>
          {eyebrow && <p className={cn('eyebrow mb-4', image && 'text-white/80')}>{eyebrow}</p>}
          <h1 className="mx-auto max-w-3xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl text-balance">{title}</h1>
          {subtitle && <p className={cn('mx-auto mt-6 max-w-xl text-base sm:text-lg', image ? 'text-white/85' : 'text-muted-foreground')}>{subtitle}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  )
}

export function TextLink({ to, children, className }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2 text-sm font-semibold text-primary', className)}>
      <span className="border-b border-primary/30 pb-0.5 transition-colors group-hover:border-primary">{children}</span>
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  )
}

export function Stars({ rating = 5, className }) {
  return (
    <div className={cn('flex gap-0.5 text-gold', className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={cn('size-4', i < rating ? 'fill-current' : 'fill-stone-200')}><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8z" /></svg>
      ))}
    </div>
  )
}
