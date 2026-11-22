import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Quote, Play, MapPin, Clock, Phone, Mail, Navigation } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useFaqs, useTestimonials } from '@/hooks/useContent'
import { formatCurrency, telLink } from '@/utils/format'
import { cn } from '@/lib/utils'
import { Img, Reveal, SectionHeading, Stars, EmptyState, ErrorState } from './Primitives'
import { Icon } from './Icon'
import { Lightbox } from './Lightbox'

/* ---------------- Masonry gallery grid with lightbox ---------------- */
export function MasonryGallery({ items, loading, columns = 'columns-1 sm:columns-2 lg:columns-3' }) {
  const [index, setIndex] = useState(null)
  if (loading)
    return (
      <div className={cn(columns, 'gap-4')}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={cn('mb-4 w-full rounded-2xl', i % 3 === 0 ? 'h-80' : i % 3 === 1 ? 'h-56' : 'h-64')} />)}
      </div>
    )
  return (
    <>
      <div className={cn(columns, 'gap-4 [column-fill:_balance]')}>
        {items.map((it, i) => (
          <motion.button
            key={it.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04 }}
            onClick={() => setIndex(i)}
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl text-left focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label={`Open ${it.title || 'image'}`}
          >
            {it.type === 'video' ? (
              <div className="relative grid aspect-video w-full place-items-center bg-[oklch(0.3_0.03_150)] text-white">
                {it.posterUrl && <Img src={it.posterUrl} alt="" className="absolute inset-0 size-full opacity-70" />}
                <span className="relative grid size-14 place-items-center rounded-full bg-white/90 text-primary"><Play className="ml-0.5 size-5 fill-current" /></span>
              </div>
            ) : (
              <Img src={it.imageUrl} alt={it.title} className="img-zoom h-auto w-full" width={900} sizes="(min-width:1024px) 33vw, 50vw" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-5 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{it.category}</p>
              <p className="font-serif text-xl">{it.title}</p>
            </div>
          </motion.button>
        ))}
      </div>
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  )
}

/* ---------------- Testimonials ---------------- */
export function TestimonialsSection() {
  const { data, loading, error } = useTestimonials()
  const items = data || []
  return (
    <section className="section bg-cream/60">
      <div className="container-lux">
        <SectionHeading eyebrow="Guest stories" title="Words from those who stayed" subtitle="Unedited reviews from families, friends and teams who made memories here." />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
          {error && <ErrorState error={error} className="md:col-span-3" />}
          {!loading && !error && items.length === 0 && <EmptyState title="Reviews coming soon" description="Our first guest stories will appear here." className="md:col-span-3" />}
          {items.slice(0, 6).map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.08} className="flex flex-col rounded-2xl bg-white p-7 shadow-soft ring-1 ring-border/50">
              <Quote className="size-7 text-gold/70" />
              <p className="mt-4 flex-1 font-serif text-xl leading-snug text-foreground/90">“{t.review}”</p>
              <div className="mt-6 flex items-center justify-between border-t pt-5">
                <div>
                  <p className="text-sm font-semibold">{t.guestName}</p>
                  {t.location && <p className="text-xs text-muted-foreground">{t.location}</p>}
                </div>
                <Stars rating={t.rating} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- FAQ ---------------- */
export function FaqSection() {
  const { data, loading, error } = useFaqs()
  const { settings } = useSiteSettings()
  return (
    <section id="faq" className="section scroll-mt-28">
      <div className="container-lux grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHeading align="left" eyebrow="Good to know" title="Frequently asked questions" subtitle="Can’t find what you’re looking for? Our team replies within the hour during business hours." />
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-full"><Link to="/contact">Ask a question</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><a href={telLink(settings.contact.phone)}>Call {settings.contact.phone}</a></Button>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          {loading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}
          {error && <ErrorState error={error} />}
          {!loading && !error && (data || []).length === 0 && <EmptyState title="No FAQs yet" />}
          <Accordion type="single" collapsible className="divide-y rounded-2xl border bg-white px-6 shadow-soft">
            {(data || []).map((f) => (
              <AccordionItem key={f.id} value={f.id} className="border-b-0">
                <AccordionTrigger className="py-5 text-left font-serif text-xl font-medium hover:no-underline">{f.question}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Location + Map ---------------- */
export function MapEmbed({ className }) {
  const { settings } = useSiteSettings()
  const q = settings.contact.mapQuery || settings.contact.address
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-sand/40 ring-1 ring-border/60', className)}>
      <iframe
        title={`Map to ${settings.businessName}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`}
        className="size-full min-h-[340px] border-0 grayscale-[35%]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

export function LocationSection() {
  const { settings } = useSiteSettings()
  const c = settings.contact
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.mapQuery || c.address)}`
  return (
    <section className="section">
      <div className="container-lux grid items-stretch gap-10 lg:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col">
          <SectionHeading align="left" eyebrow="Location" title="An hour from the city, a world away" />
          <Reveal delay={0.1} className="mt-8 space-y-5 text-[15px]">
            <p className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" />{c.address}</p>
            <p className="flex gap-3"><Phone className="size-5 shrink-0 text-primary" /><a href={telLink(c.phone)} className="hover:text-primary">{c.phone}</a></p>
            <p className="flex gap-3"><Mail className="size-5 shrink-0 text-primary" /><a href={`mailto:${c.email}`} className="break-all hover:text-primary">{c.email}</a></p>
            <div className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-primary" /><div>{c.businessHours?.map((h) => <p key={h.day}><span className="text-muted-foreground">{h.day}:</span> {h.hours}</p>)}</div></div>
          </Reveal>
          <Reveal delay={0.15} className="mt-8">
            <Button asChild variant="outline" className="rounded-full"><a href={directions} target="_blank" rel="noreferrer"><Navigation /> Get directions</a></Button>
          </Reveal>
        </div>
        <Reveal delay={0.1}><MapEmbed className="h-full min-h-[380px]" /></Reveal>
      </div>
    </section>
  )
}

/* ---------------- Feature grid (highlights / why choose us) ---------------- */
export function FeatureGrid({ items, className }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-2xl bg-border/70 ring-1 ring-border/70 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((f, i) => (
        <Reveal key={f.title} delay={i * 0.06} className="group bg-white p-8 transition-colors hover:bg-cream/50">
          <div className="grid size-11 place-items-center rounded-full bg-accent text-primary transition-transform duration-500 group-hover:-translate-y-1"><Icon name={f.icon} className="size-5" /></div>
          <h3 className="mt-6 text-2xl">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
        </Reveal>
      ))}
    </div>
  )
}

/* ---------------- Experience card ---------------- */
export function ExperienceCard({ item, index = 0, currency }) {
  return (
    <Reveal delay={(index % 3) * 0.07} className="group relative overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/5]">
        <Img src={item.image} alt={item.title} className="img-zoom absolute inset-0 size-full" width={800} sizes="(min-width:1024px) 33vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur"><Icon name={item.icon} className="size-4" /></span>
            {item.category && <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">{item.category}</span>}
          </div>
          <h3 className="text-3xl">{item.title}</h3>
          <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-white/85 opacity-0 transition-all duration-500 group-hover:max-h-40 group-hover:opacity-100 group-focus-within:max-h-40 group-focus-within:opacity-100">{item.description}</p>
          <p className="mt-3 text-sm font-medium text-[oklch(0.86_0.07_80)]">{item.price > 0 ? `From ${formatCurrency(item.price, currency)}` : 'Included with your stay'}</p>
        </div>
      </div>
    </Reveal>
  )
}
