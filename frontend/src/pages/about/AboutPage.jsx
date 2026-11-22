import { Link } from 'react-router-dom'
import { Target, Eye, Mountain, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/common/Seo'
import { PageHero, Reveal, SectionHeading, Img } from '@/components/common/Primitives'
import { FeatureGrid, MasonryGallery } from '@/components/common/Sections'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useAccommodations, useGallery } from '@/hooks/useContent'
import { initials } from '@/utils/format'

export default function AboutPage() {
  const { settings } = useSiteSettings()
  const a = settings.about
  const { data: gallery, loading } = useGallery()
  const { data: stays } = useAccommodations()
  const totals = (stays || []).reduce((t, s) => ({ beds: t.beds + (s.bedrooms || 0), guests: Math.max(t.guests, s.capacity || 0) }), { beds: 0, guests: 0 })

  return (
    <>
      <Seo title="Our Story" description={a.body} path="/about" />
      <PageHero eyebrow="About us" title={a.heading} subtitle={settings.tagline} image={settings.hero.images?.[1]?.url || a.image} />

      <section className="section">
        <div className="container-lux grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal><Img src={a.image} alt="Farmhouse" className="aspect-[4/5] w-full rounded-[28px]" width={1200} /></Reveal>
          <div>
            <SectionHeading align="left" eyebrow="Our story" title="From family orchard to private retreat" />
            <Reveal delay={0.1}><p className="mt-6 text-lg leading-relaxed text-muted-foreground">{a.story}</p></Reveal>
            <Reveal delay={0.15} className="mt-10 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream p-6">
                <Target className="size-5 text-primary" />
                <h3 className="mt-4 text-2xl">Our mission</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.mission}</p>
              </div>
              <div className="rounded-2xl bg-accent/60 p-6">
                <Eye className="size-5 text-primary" />
                <h3 className="mt-4 text-2xl">Our vision</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.vision}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section bg-cream/60">
        <div className="container-lux">
          <SectionHeading eyebrow="Property overview" title="The estate at a glance" />
          <Reveal className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border md:grid-cols-4">
            {[
              ...a.stats.slice(0, 2),
              { value: totals.beds || '—', label: 'Bedrooms across stays' },
              { value: totals.guests || '—', label: 'Max guests per stay' },
            ].map((s) => (
              <div key={s.label} className="bg-white p-8 text-center">
                <p className="font-serif text-5xl text-primary">{s.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </Reveal>
          <FeatureGrid items={settings.highlights} className="mt-8" />
        </div>
      </section>

      <section className="section">
        <div className="container-lux grid gap-10 lg:grid-cols-2">
          {[
            { icon: Mountain, title: 'Nature & surroundings', text: a.surroundings, img: settings.instagram.images?.[4] },
            { icon: HeartHandshake, title: 'The hospitality', text: a.hospitality, img: settings.instagram.images?.[1] },
          ].map((b, i) => (
            <Reveal key={b.title} delay={i * 0.1} className="group overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-border/50">
              <div className="aspect-[16/9] overflow-hidden"><Img src={b.img} alt="" className="img-zoom size-full" width={1000} /></div>
              <div className="p-8">
                <b.icon className="size-5 text-primary" />
                <h3 className="mt-4 text-3xl">{b.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section bg-cream/60">
        <div className="container-lux">
          <SectionHeading eyebrow="Gallery" title="Moments around the farm" />
          <div className="mt-12"><MasonryGallery items={(gallery || []).filter((g) => g.type !== 'video').slice(0, 9)} loading={loading} /></div>
        </div>
      </section>

      {settings.team?.length > 0 && (
        <section className="section">
          <div className="container-lux">
            <SectionHeading eyebrow="Our team" title="The people who host you" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {settings.team.map((m, i) => (
                <Reveal key={m.name + i} delay={i * 0.07} className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50">
                  {m.image ? <Img src={m.image} alt={m.name} className="size-20 rounded-full" width={200} /> : (
                    <div className="grid size-20 shrink-0 place-items-center rounded-full bg-accent font-serif text-2xl text-primary">{initials(m.name)}</div>
                  )}
                  <div>
                    <p className="font-serif text-2xl">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.role}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-14 text-center"><Button asChild size="lg" className="rounded-full px-8"><Link to="/booking">Plan your stay</Link></Button></Reveal>
          </div>
        </section>
      )}
    </>
  )
}
