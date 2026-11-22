import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CalendarDays, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Seo } from '@/components/common/Seo'
import { StatusBadge, ErrorState, EmptyState } from '@/components/common/Primitives'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { useApi } from '@/hooks/useApi'
import { formatDate } from '@/utils/format'

export default function ConfirmationPage() {
  const { bookingId } = useParams()
  const { data: b, loading, error } = useApi(['bookings', bookingId], `/bookings/${bookingId}`, { select: (r) => r.booking })

  return (
    <div className="bg-cream/50 pt-32 pb-20 sm:pt-36">
      <Seo title="Booking received" noindex />
      <div className="container-lux max-w-3xl">
        {loading ? <Skeleton className="h-[480px] rounded-[28px]" /> : error ? <ErrorState error={error} /> : !b ? (
          <EmptyState title="Booking not found" action={<Button asChild className="rounded-full"><Link to="/account/bookings">My bookings</Link></Button>} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] bg-white shadow-lift ring-1 ring-border/60">
            <div className="bg-primary px-8 py-12 text-center text-primary-foreground">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <CheckCircle2 className="mx-auto size-14 text-[oklch(0.86_0.07_80)]" />
              </motion.div>
              <h1 className="mt-5 text-4xl sm:text-5xl">Thank you, {b.guestName?.split(' ')[0]}!</h1>
              <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
                {b.bookingStatus === 'pending' ? 'Your booking request has been received. Our team will confirm it shortly — you’ll get an email as soon as it’s confirmed.' : 'Here are the details of your booking.'}
              </p>
            </div>
            <div className="space-y-8 p-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Booking ID</p>
                  <button className="mt-1 flex items-center gap-2 font-mono text-xl font-semibold" onClick={() => { navigator.clipboard?.writeText(b.bookingId); toast.success('Booking ID copied') }}>
                    {b.bookingId} <Copy className="size-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex gap-2"><StatusBadge status={b.bookingStatus} /><StatusBadge status={b.paymentStatus} /></div>
              </div>
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Accommodation</dt><dd className="mt-1 font-serif text-2xl">{b.accommodationName}</dd></div>
                <div><dt className="text-muted-foreground">Guests</dt><dd className="mt-1 font-medium">{b.adults} adults{b.children ? `, ${b.children} children` : ''}</dd></div>
                <div><dt className="text-muted-foreground">Check-in</dt><dd className="mt-1 flex items-center gap-2 font-medium"><CalendarDays className="size-4 text-primary" />{formatDate(b.checkIn, 'EEEE, dd MMM yyyy')}</dd></div>
                <div><dt className="text-muted-foreground">Check-out</dt><dd className="mt-1 flex items-center gap-2 font-medium"><CalendarDays className="size-4 text-primary" />{formatDate(b.checkOut, 'EEEE, dd MMM yyyy')}</dd></div>
              </dl>
              <div className="rounded-2xl border p-6"><PriceBreakdown pricing={b.pricing} /></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="flex-1 rounded-full"><Link to={`/account/bookings/${b.bookingId}`}>View booking</Link></Button>
                <Button asChild size="lg" variant="outline" className="flex-1 rounded-full"><Link to="/">Back to home</Link></Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
