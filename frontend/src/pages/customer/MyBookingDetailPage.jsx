import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CreditCard, Users, XCircle, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Seo } from '@/components/common/Seo'
import { StatusBadge, ErrorState, EmptyState, Spinner } from '@/components/common/Primitives'
import { WhatsAppIcon } from '@/components/common/BrandIcons'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { BookingTimeline } from '@/components/booking/BookingTimeline'
import { useApi, useInvalidate } from '@/hooks/useApi'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useAuth } from '@/context/AuthContext'
import { cancelMyBooking } from '@/services/booking/bookingService'
import { payForBooking } from '@/services/booking/paymentService'
import { errorMessage as callableErrorMessage } from '@/services/api/client'
import { formatCurrency, formatDate, whatsappLink } from '@/utils/format'

export default function MyBookingDetailPage() {
  const { bookingId } = useParams()
  const { settings } = useSiteSettings()
  const { user } = useAuth()
  const { data: b, loading, error } = useApi(['bookings', bookingId], `/bookings/${bookingId}`, { select: (r) => r.booking })
  const { data: payments } = useApi(['bookings', bookingId, 'payments'], b ? `/bookings/${bookingId}/payments` : null, { select: (r) => r.items, enabled: !!b })
  const invalidate = useInvalidate()
  const [paying, setPaying] = useState(null)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  if (loading) return <Skeleton className="h-[480px] rounded-2xl" />
  if (error) return <ErrorState error={error} />
  if (!b) return <EmptyState title="Booking not found" action={<Button asChild className="rounded-full"><Link to="/account/bookings">Back to bookings</Link></Button>} />

  const c = b.pricing?.currency || 'INR'
  const due = Math.max(0, (b.totalAmount || 0) - (b.amountPaid || 0))
  const canPay = b.bookingStatus === 'confirmed' && due > 0
  const canPayAdvance = canPay && !(b.amountPaid > 0) && b.pricing?.advanceAmount > 0 && b.pricing.advanceAmount < b.totalAmount
  const canCancel = ['pending', 'confirmed'].includes(b.bookingStatus) && !b.cancellationRequested
  const wa = whatsappLink(settings.contact.whatsapp, `Hello! Regarding my booking ${b.bookingId} (${b.accommodationName}, ${formatDate(b.checkIn)} – ${formatDate(b.checkOut)}).`)

  const pay = async (mode) => {
    setPaying(mode)
    try {
      const r = await payForBooking({ bookingId: b.bookingId, mode, businessName: settings.businessName, prefill: { name: b.guestName, email: b.email, contact: b.phone } })
      if (r) toast.success('Payment successful — thank you!')
      invalidate('bookings')
    } catch (e) {
      toast.error(callableErrorMessage(e))
    } finally {
      setPaying(null)
    }
  }

  const cancel = async () => {
    setCancelling(true)
    try {
      const r = await cancelMyBooking(b.bookingId, reason)
      invalidate('bookings')
      toast.success(r.status === 'cancelled' ? 'Booking cancelled' : 'Cancellation request sent to our team')
    } catch (e) {
      toast.error(callableErrorMessage(e))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <Seo title={`Booking ${b.bookingId}`} noindex />
      <Link to="/account/bookings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All bookings</Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{b.bookingId}</span>
              <StatusBadge status={b.bookingStatus} />
              <StatusBadge status={b.paymentStatus} />
              {b.cancellationRequested && b.bookingStatus === 'confirmed' && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-800 ring-1 ring-rose-200">Cancellation requested</span>}
            </div>
            <h2 className="mt-3 text-4xl">{b.accommodationName}</h2>
            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
              <p className="flex gap-2"><CalendarDays className="size-4 text-primary" /><span><span className="block text-muted-foreground">Check-in</span>{formatDate(b.checkIn, 'EEE, dd MMM yyyy')}</span></p>
              <p className="flex gap-2"><CalendarDays className="size-4 text-primary" /><span><span className="block text-muted-foreground">Check-out</span>{formatDate(b.checkOut, 'EEE, dd MMM yyyy')}</span></p>
              <p className="flex gap-2"><Users className="size-4 text-primary" /><span><span className="block text-muted-foreground">Guests</span>{b.adults} adults{b.children ? `, ${b.children} children` : ''}</span></p>
            </div>
            {b.specialRequests && <p className="mt-6 rounded-xl bg-cream p-4 text-sm"><span className="font-medium">Special requests: </span>{b.specialRequests}</p>}
            {b.adminNote && <p className="mt-3 rounded-xl bg-accent/50 p-4 text-sm"><span className="font-medium">Note from the team: </span>{b.adminNote}</p>}
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-8">
            <h3 className="mb-6 text-2xl">Status timeline</h3>
            <BookingTimeline booking={b} />
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-8">
            <h3 className="mb-4 flex items-center gap-2 text-2xl"><Receipt className="size-5 text-primary" /> Payment history</h3>
            {!payments?.length ? <p className="text-sm text-muted-foreground">No payments yet.</p> : (
              <ul className="divide-y text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span><span className="font-medium">{formatCurrency(p.amount, c)}</span> · {p.method || p.mode} <span className="block font-mono text-xs text-muted-foreground">{p.gatewayPaymentId || p.reference || p.id}</span></span>
                    <span className="text-right"><StatusBadge status={p.status === 'captured' ? 'paid' : p.status} /><span className="block text-xs text-muted-foreground">{formatDate(p.createdAt, 'dd MMM yyyy, HH:mm')}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="rounded-2xl bg-white p-6 shadow-lift ring-1 ring-border/60">
            <h3 className="mb-5 text-2xl">Price details</h3>
            <PriceBreakdown pricing={b.pricing} />
            <div className="mt-5 space-y-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums">{formatCurrency(b.amountPaid || 0, c)}</span></div>
              {b.amountRefunded > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Refunded</span><span className="tabular-nums">{formatCurrency(b.amountRefunded, c)}</span></div>}
              <div className="flex justify-between font-semibold"><span>Balance due</span><span className="tabular-nums">{formatCurrency(due, c)}</span></div>
            </div>
            {b.bookingStatus === 'pending' && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Payment opens once our team confirms your booking.</p>}
            {canPay && (
              <div className="mt-5 grid gap-2">
                {canPayAdvance && <Button size="lg" className="rounded-full" disabled={!!paying} onClick={() => pay('advance')}>{paying === 'advance' ? <Spinner className="size-4 text-current" /> : <CreditCard />} Pay advance {formatCurrency(b.pricing.advanceAmount, c)}</Button>}
                <Button size="lg" variant={canPayAdvance ? 'outline' : 'default'} className="rounded-full" disabled={!!paying} onClick={() => pay('full')}>{paying === 'full' ? <Spinner className="size-4" /> : <CreditCard />} Pay {b.amountPaid > 0 ? 'balance' : 'in full'} {formatCurrency(due, c)}</Button>
                <p className="text-center text-xs text-muted-foreground">Secured by Razorpay. We never see or store your card details.</p>
              </div>
            )}
          </section>
          <section className="space-y-3 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50">
            {wa && <Button asChild variant="outline" className="w-full rounded-full"><a href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon className="text-[#25D366]" /> Message us about this booking</a></Button>}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" className="w-full rounded-full text-destructive hover:bg-destructive/5 hover:text-destructive"><XCircle /> {b.bookingStatus === 'pending' ? 'Cancel booking' : 'Request cancellation'}</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{b.bookingStatus === 'pending' ? 'Cancel this booking?' : 'Request cancellation?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {b.bookingStatus === 'pending' ? 'Your request will be cancelled immediately and the dates released.' : 'Our team will review your request according to the cancellation policy. Any eligible refund will be processed to your original payment method.'}
                      <span className="mt-2 block text-xs">{settings.bookingSettings.cancellationPolicy}</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep booking</AlertDialogCancel>
                    <AlertDialogAction onClick={cancel} disabled={cancelling} className="bg-destructive text-white hover:bg-destructive/90">{cancelling && <Spinner className="size-4 text-current" />} Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <p className="text-center text-xs text-muted-foreground">Signed in as {user?.email}</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
