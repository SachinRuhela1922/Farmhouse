import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Check, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/common/Seo'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useAccommodations, useExperiences, useGallery } from '@/hooks/useContent'
import { AvailabilityWidget } from '@/components/booking/AvailabilityWidget'
import { AccommodationCard, AccommodationCardSkeleton } from '@/components/common/AccommodationCard'
import { Img, Reveal, SectionHeading, TextLink, EmptyState, ErrorState } from '@/components/common/Primitives'
import { FaqSection, FeatureGrid, LocationSection, MasonryGallery, TestimonialsSection, ExperienceCard } from '@/components/common/Sections'
import { VideoShowcase } from '@/components/common/VideoShowcase'
import { InstagramIcon } from '@/components/common/BrandIcons'
import { NewsletterForm } from '@/components/common/NewsletterForm'
import { ContactForm } from '@/pages/contact/ContactForm'
import { cn } from '@/lib/utils'
import { sized } from '@/utils/images'

function Hero() {
  const { settings } = useSiteSettings()
  const hero = settings.hero
  const images = hero.images?.length ? hero.images : [{ url: '' }]
  const [i, setI] = useState(0)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const isVideo = /\.(mp4|webm)(\?|$)/i.test(hero.videoUrl || '') || hero.videoUrl?.includes('firebasestorage')

  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % images.length), 7000)
    return () => clearInterval(t)
  }, [images.length])

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-14 pt-40 sm:items-center sm:pb-20">
      <motion.div style={{ y }} className="absolute inset-0 -z-20">
        {isVideo ? (
          <video src={hero.videoUrl} autoPlay muted loop playsInline poster={sized(images[0]?.url, 1800)} className="size-full object-cover" />
        ) : (
          <AnimatePresence initial={false}>
            <motion.img
              key={i}
              src={sized(images[i]?.url, 2400)}
              alt=""
              fetchPriority="high"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.4 }, scale: { duration: 8, ease: 'linear' } }}
              className="absolute inset-0 size-full bg-sand object-cover"
            />
          </AnimatePresence>
        )}
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/25 to-black/60" />

      <motion.div style={{ opacity: fade }} className="container-lux w-full text-white">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="eyebrow text-white/80">
          {hero.eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-5 max-w-4xl text-[2.9rem] leading-[1] sm:text-7xl lg:text-[5.4rem] text-balance"
        >
          {hero.heading}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55 }} className="mt-6 max-w-xl text-base text-white/85 sm:text-lg">
          {hero.subtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.75 }} className="mt-10 max-w-4xl text-foreground">
          <AvailabilityWidget />
        </motion.div>
      </motion.div>
      <a href="#about" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/70 sm:flex" aria-label="Scroll to content">
        Scroll <ArrowDown className="size-4 animate-bounce" />
      </a>
    </section>
  )
}

function About() {
  const { settings } = useSiteSettings()
  const a = settings.about
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  return (
    <section id="about" ref={ref} className="section scroll-mt-24">
      <div className="container-lux grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
            <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0">
              <Img src={a.image} alt="The farmhouse" className="size-full" width={1200} sizes="(min-width:1024px) 50vw, 100vw" />
            </motion.div>
          </div>
          <div className="absolute -bottom-6 -right-4 hidden rounded-2xl bg-white p-6 shadow-lift sm:block">
            <p className="font-serif text-5xl text-primary">{a.stats?.[0]?.value}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{a.stats?.[0]?.label}</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading align="left" eyebrow="About the farmhouse" title={a.heading} subtitle={a.body} />
          <Reveal delay={0.1} className="mt-10 grid grid-cols-2 gap-6 border-t pt-8 sm:grid-cols-4">
            {a.stats?.map((s) => (
              <div key={s.label}>
                <p className="font-serif text-4xl text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15} className="mt-10"><TextLink to="/about">Read our story</TextLink></Reveal>
        </div>
      </div>
    </section>
  )
}

function Highlights() {
  const { settings } = useSiteSettings()
  return (
    <section className="pb-20 sm:pb-28">
      <div className="container-lux"><FeatureGrid items={settings.highlights} /></div>
    </section>
  )
}

function Experiences() {
  const { data, loading, error } = useExperiences()
  const { settings } = useSiteSettings()
  return (
    <section className="section bg-cream/60">
      <div className="container-lux">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading align="left" eyebrow="Featured experiences" title="Days that unfold slowly" subtitle="Swim, feast, wander and celebrate — curated by our hosts, entirely at your pace." />
          <Reveal><TextLink to="/experiences">All experiences</TextLink></Reveal>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-sand/50" />)}
          {error && <ErrorState error={error} className="sm:col-span-3" />}
          {!loading && !error && !data?.length && <EmptyState title="Experiences coming soon" className="sm:col-span-3" />}
          {data?.slice(0, 6).map((e, i) => <ExperienceCard key={e.id} item={e} index={i} currency={settings.bookingSettings.currency} />)}
        </div>
      </div>
    </section>
  )
}

function Accommodations() {
  const { data, loading, error } = useAccommodations()
  return (
    <section className="section">
      <div className="container-lux">
        <SectionHeading eyebrow="Accommodation" title="Rooms with a view of the orchard" subtitle="From the whole estate to a cottage for two — every stay is private, restored and quietly luxurious." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <AccommodationCardSkeleton key={i} />)}
          {error && <ErrorState error={error} className="lg:col-span-3" />}
          {!loading && !error && !data?.length && <EmptyState title="Accommodation coming soon" description="Our stays are being prepared. Check back shortly." className="lg:col-span-3" />}
          {data?.slice(0, 3).map((a, i) => <AccommodationCard key={a.id} item={a} index={i} />)}
        </div>
        {data?.length > 3 && <div className="mt-12 text-center"><Button asChild variant="outline" size="lg" className="rounded-full"><Link to="/accommodation">View all stays</Link></Button></div>}
      </div>
    </section>
  )
}

function Amenities() {
  const { data } = useAccommodations()
  const all = [...new Set((data || []).flatMap((a) => a.amenities || []))]
  if (!all.length) return null
  return (
    <section className="pb-20 sm:pb-28">
      <div className="container-lux">
        <Reveal className="rounded-[28px] bg-primary px-6 py-14 text-primary-foreground sm:px-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
            <div>
              <p className="eyebrow text-primary-foreground/70">Amenities</p>
              <h2 className="mt-3 text-4xl sm:text-5xl">Everything you need, nothing you don’t</h2>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {all.map((a) => <li key={a} className="flex items-center gap-2.5 text-sm"><Check className="size-4 shrink-0 text-[oklch(0.86_0.07_80)]" />{a}</li>)}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function GalleryPreview() {
  const { data, loading } = useGallery()
  const images = (data || []).filter((g) => g.type !== 'video').slice(0, 6)
  if (!loading && !images.length) return null
  return (
    <section className="section pt-0">
      <div className="container-lux">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading align="left" eyebrow="Gallery" title="A glimpse of Willowmere" />
          <Reveal><TextLink to="/gallery">Open the full gallery</TextLink></Reveal>
        </div>
        <MasonryGallery items={images} loading={loading} />
      </div>
    </section>
  )
}

function WhyChooseUs() {
  const { settings } = useSiteSettings()
  return (
    <section className="section">
      <div className="container-lux">
        <SectionHeading eyebrow="Why choose us" title="Hospitality that feels like coming home" />
        <FeatureGrid items={settings.whyChooseUs} className="mt-14" />
      </div>
    </section>
  )
}

function Pricing() {
  const { settings } = useSiteSettings()
  return (
    <section className="section bg-cream/60">
      <div className="container-lux">
        <SectionHeading eyebrow="Pricing" title="Simple, transparent rates" subtitle="Taxes and charges are always shown before you confirm. Final prices are calculated for your exact dates at booking." />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {settings.pricingHighlights?.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} className={cn('flex flex-col rounded-2xl p-8 ring-1', p.featured ? 'bg-primary text-primary-foreground ring-primary shadow-lift lg:-translate-y-3' : 'bg-white ring-border/60 shadow-soft')}>
              {p.featured && <span className="mb-5 self-start rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">Most loved</span>}
              <h3 className="text-2xl">{p.title}</h3>
              <p className="mt-4 font-serif text-5xl">{p.price}</p>
              <p className={cn('mt-1 text-sm', p.featured ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{p.note}</p>
              <ul className="mt-7 flex-1 space-y-3 text-sm">
                {p.features?.map((f) => <li key={f} className="flex gap-2.5"><Check className={cn('size-4 shrink-0', p.featured ? 'text-[oklch(0.86_0.07_80)]' : 'text-primary')} />{f}</li>)}
              </ul>
              <Button asChild size="lg" variant={p.featured ? 'secondary' : 'outline'} className="mt-8 rounded-full"><Link to="/booking">Check dates</Link></Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function InstagramSection() {
  const { settings } = useSiteSettings()
  const ig = settings.instagram
  const link = settings.socialLinks?.instagram
  if (!ig?.images?.length) return null
  return (
    <section className="section pb-0">
      <div className="container-lux text-center">
        <SectionHeading eyebrow="Follow along" title={ig.handle} />
        {link && <Reveal className="mt-6"><Button asChild variant="outline" className="rounded-full"><a href={link} target="_blank" rel="noreferrer"><InstagramIcon /> Follow on Instagram</a></Button></Reveal>}
      </div>
      <div className="mt-12 grid grid-cols-3 gap-1 sm:grid-cols-6">
        {ig.images.slice(0, 6).map((src, i) => (
          <a key={i} href={link || '#'} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden" aria-label="View on Instagram">
            <Img src={src} alt="" className="img-zoom size-full" width={500} sizes="17vw" />
            <span className="absolute inset-0 grid place-items-center bg-black/30 text-white opacity-0 transition group-hover:opacity-100"><InstagramIcon width={24} height={24} /></span>
          </a>
        ))}
      </div>
    </section>
  )
}

function ContactCta() {
  return (
    <section className="section bg-cream/60">
      <div className="container-lux grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionHeading align="left" eyebrow="Contact" title="Planning something special?" subtitle="Tell us about your group, dates and occasion. We’ll come back with ideas, availability and a personalised quote." />
          <Reveal delay={0.1} className="mt-10 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50">
            <div className="flex items-center gap-3"><Send className="size-5 text-primary" /><p className="font-serif text-2xl">Join our newsletter</p></div>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Seasonal offers and quiet weekday deals.</p>
            <NewsletterForm />
          </Reveal>
        </div>
        <Reveal delay={0.1} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-10"><ContactForm /></Reveal>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Seo path="/" />
      <Hero />
      <About />
      <Highlights />
      <Experiences />
      <Accommodations />
      <Amenities />
      <GalleryPreview />
      <VideoShowcase />
      <TestimonialsSection />
      <WhyChooseUs />
      <Pricing />
      <LocationSection />
      <FaqSection />
      <InstagramSection />
      <ContactCta />
    </>
  )
}
