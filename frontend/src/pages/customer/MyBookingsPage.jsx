import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Luggage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Seo } from '@/components/common/Seo'
import { StatusBadge, EmptyState, ErrorState, Reveal } from '@/components/common/Primitives'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate, toISODate } from '@/utils/format'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const { data, loading, error } = useApi(['bookings', 'mine', user?.id], user ? '/bookings/mine' : null, { select: (r) => r.items, enabled: !!user })
  const today = toISODate(new Date())
  const upcoming = (data || []).filter((b) => b.checkOut >= today && ['pending', 'confirmed'].includes(b.bookingStatus))
  const past = (data || []).filter((b) => !upcoming.includes(b))

  if (loading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
  if (error) return <ErrorState error={error} />
  if (!data?.length)
    return <EmptyState icon={Luggage} title="No bookings yet" description="When you book a stay it will appear here." action={<Button asChild className="rounded-full"><Link to="/booking">Book your first stay</Link></Button>} />

  const List = ({ items }) => (
    <div className="space-y-3">
      {items.map((b, i) => (
        <Reveal key={b.id} delay={i * 0.04}>
          <Link to={`/account/bookings/${b.bookingId}`} className="group flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/50 transition hover:shadow-lift sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{b.bookingId}</span>
                <StatusBadge status={b.bookingStatus} />
                <StatusBadge status={b.paymentStatus} />
              </div>
              <p className="mt-2 font-serif text-2xl">{b.accommodationName}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" />{formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} night{b.nights > 1 && 's'}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="font-serif text-2xl">{formatCurrency(b.totalAmount, b.pricing?.currency)}</span>
              <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  )

  return (
    <div className="space-y-10">
      <Seo title="My bookings" noindex />
      {upcoming.length > 0 && <div><h2 className="mb-4 text-3xl">Upcoming</h2><List items={upcoming} /></div>}
      {past.length > 0 && <div><h2 className="mb-4 text-3xl">History</h2><List items={past} /></div>}
    </div>
  )
}
