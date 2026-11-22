import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/common/Seo'
import { PageHero, EmptyState, ErrorState, Reveal } from '@/components/common/Primitives'
import { ExperienceCard } from '@/components/common/Sections'
import { WhatsAppIcon } from '@/components/common/BrandIcons'
import { useExperiences } from '@/hooks/useContent'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { whatsappLink } from '@/utils/format'
import { cn } from '@/lib/utils'

export default function ExperiencesPage() {
  const { data, loading, error } = useExperiences()
  const { settings } = useSiteSettings()
  const [cat, setCat] = useState('All')
  const cats = useMemo(() => ['All', ...new Set((data || []).map((e) => e.category).filter(Boolean))], [data])
  const list = (data || []).filter((e) => cat === 'All' || e.category === cat)
  const wa = whatsappLink(settings.contact.whatsapp, 'Hello! I would like to plan an experience / event at the farmhouse.')

  return (
    <>
      <Seo title="Experiences" description="Pool days, outdoor dining, bonfires, celebrations and corporate offsites at the farmhouse." path="/experiences" />
      <PageHero eyebrow="Experiences" title="Celebrate, unwind, gather" subtitle="From quiet swims to milestone celebrations — curated by our hosts." image={data?.[2]?.image || settings.videoShowcase.posterUrl} />
      <section className="section pt-14">
        <div className="container-lux">
          {cats.length > 2 && (
            <div className="mb-10 flex flex-wrap justify-center gap-2">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                  className={cn('rounded-full px-5 py-2 text-sm font-medium ring-1 transition', cat === c ? 'bg-primary text-primary-foreground ring-primary' : 'bg-white ring-border hover:ring-primary/40')}>
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-sand/50" />)}
            {error && <ErrorState error={error} className="lg:col-span-3" />}
            {!loading && !error && !list.length && <EmptyState icon={Sparkles} title="No experiences yet" className="sm:col-span-2 lg:col-span-3" />}
            {list.map((e, i) => <ExperienceCard key={e.id} item={e} index={i} currency={settings.bookingSettings.currency} />)}
          </div>
          <Reveal className="mt-16 flex flex-col items-center gap-6 rounded-[28px] bg-cream px-6 py-14 text-center">
            <h2 className="max-w-xl text-4xl sm:text-5xl">Planning a celebration or offsite?</h2>
            <p className="max-w-lg text-muted-foreground">Share your plans and our events team will put together a tailored proposal — décor, catering, music and stay.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full"><Link to="/contact">Send an enquiry</Link></Button>
              {wa && <Button asChild size="lg" variant="outline" className="rounded-full"><a href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon className="text-[#25D366]" /> WhatsApp us</a></Button>}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
