import { useMemo, useState } from 'react'
import { Seo } from '@/components/common/Seo'
import { PageHero, EmptyState, ErrorState } from '@/components/common/Primitives'
import { AccommodationCard, AccommodationCardSkeleton } from '@/components/common/AccommodationCard'
import { useAccommodations } from '@/hooks/useContent'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { cn } from '@/lib/utils'
import { BedDouble } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'All stays', test: () => true },
  { id: 'couples', label: 'Couples', test: (a) => a.capacity <= 3 },
  { id: 'families', label: 'Families', test: (a) => a.capacity >= 4 && a.capacity <= 8 },
  { id: 'groups', label: 'Large groups', test: (a) => a.capacity > 8 },
]

export default function AccommodationPage() {
  const { data, loading, error } = useAccommodations()
  const { settings } = useSiteSettings()
  const [filter, setFilter] = useState('all')
  const list = useMemo(() => (data || []).filter(FILTERS.find((f) => f.id === filter).test), [data, filter])

  return (
    <>
      <Seo title="Accommodation" description="Private villas, cottages and the whole farmhouse — choose the stay that suits your group." path="/accommodation" />
      <PageHero eyebrow="Accommodation" title="Stay in the orchard" subtitle="Every stay is private, restored with local materials and looked after by our resident team." image={data?.[0]?.images?.[0]?.url || settings.hero.images?.[0]?.url} />
      <section className="section pt-14">
        <div className="container-lux">
          <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist">
            {FILTERS.map((f) => (
              <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                className={cn('rounded-full px-5 py-2 text-sm font-medium ring-1 transition', filter === f.id ? 'bg-primary text-primary-foreground ring-primary' : 'bg-white ring-border hover:ring-primary/40')}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading && Array.from({ length: 6 }).map((_, i) => <AccommodationCardSkeleton key={i} />)}
            {error && <ErrorState error={error} className="lg:col-span-3" />}
            {!loading && !error && list.length === 0 && (
              <EmptyState icon={BedDouble} title="No stays match this filter" description="Try another category or contact us for a custom arrangement." className="md:col-span-2 lg:col-span-3" />
            )}
            {list.map((a, i) => <AccommodationCard key={a.id} item={a} index={i} />)}
          </div>
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Check-in from {settings.bookingSettings.checkInTime} · Check-out by {settings.bookingSettings.checkOutTime}
          </p>
        </div>
      </section>
    </>
  )
}
