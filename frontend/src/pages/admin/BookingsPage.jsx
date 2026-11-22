import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Check, X, Ban, Flag, Phone, Mail, Undo2, Wallet, CalendarX2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Panel, SearchInput } from '@/components/admin/AdminUi'
import { StatusBadge, EmptyState, ErrorState, Spinner } from '@/components/common/Primitives'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { BookingTimeline } from '@/components/booking/BookingTimeline'
import { WhatsAppIcon } from '@/components/common/BrandIcons'
import { useApi, useInvalidate } from '@/hooks/useApi'
import { adminUpdateBooking, adminRefundPayment, adminRecordOfflinePayment } from '@/services/booking/bookingService'
import { errorMessage as callableErrorMessage } from '@/services/api/client'
import { formatCurrency, formatDate, toCsv, downloadFile, whatsappLink, telLink } from '@/utils/format'
import { BOOKING_STATUSES, PAYMENT_STATUSES, STATUS_STYLES } from '@/utils/constants'

/** Allowed admin transitions (mirrored & enforced server-side). */
const TRANSITIONS = {
  pending: [['confirmed', 'Confirm', Check], ['rejected', 'Reject', X]],
  confirmed: [['completed', 'Mark completed', Flag], ['cancelled', 'Cancel', Ban]],
  rejected: [],
  cancelled: [],
  completed: [],
}

function BookingDetail({ booking: b, onClose }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(null)
  const [offline, setOffline] = useState({ amount: '', reference: '', method: 'cash' })
  const [refundAmount, setRefundAmount] = useState('')
  const { data: payments } = useApi(['bookings', b.bookingId, 'payments'], `/bookings/${b.bookingId}/payments`, { select: (r) => r.items })
  const invalidate = useInvalidate()
  const c = b.pricing?.currency || 'INR'
  const due = Math.max(0, (b.totalAmount || 0) - (b.amountPaid || 0))

  const run = async (key, fn, success) => {
    setBusy(key)
    try { await fn(); toast.success(success); await invalidate('admin', 'bookings') } catch (e) { toast.error(callableErrorMessage(e)) } finally { setBusy(null) }
  }

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader className="border-b">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={b.bookingStatus} /><StatusBadge status={b.paymentStatus} />{b.cancellationRequested && b.bookingStatus === 'confirmed' && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800 ring-1 ring-rose-200">Cancellation requested</span>}</div>
        <SheetTitle className="font-serif text-3xl font-medium">{b.guestName}</SheetTitle>
        <SheetDescription className="font-mono">{b.bookingId}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Accommodation</p><p className="font-medium">{b.accommodationName}</p></div>
          <div><p className="text-xs text-muted-foreground">Guests</p><p className="font-medium">{b.adults} adults, {b.children} children</p></div>
          <div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{formatDate(b.checkIn, 'EEE dd MMM yyyy')}</p></div>
          <div><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{formatDate(b.checkOut, 'EEE dd MMM yyyy')} · {b.nights}N</p></div>
          <div className="col-span-2 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><a href={telLink(b.phone)}><Phone /> {b.phone}</a></Button>
            <Button asChild variant="outline" size="sm"><a href={`mailto:${b.email}`}><Mail /> Email</a></Button>
            {whatsappLink(b.phone) && <Button asChild variant="outline" size="sm"><a href={whatsappLink(b.phone, `Hello ${b.guestName}, regarding your booking ${b.bookingId}…`)} target="_blank" rel="noreferrer"><WhatsAppIcon className="text-[#25D366]" /> WhatsApp</a></Button>}
          </div>
          {b.specialRequests && <p className="col-span-2 rounded-lg bg-cream p-3"><span className="font-medium">Requests: </span>{b.specialRequests}</p>}
          {b.cancellationReason && <p className="col-span-2 rounded-lg bg-rose-50 p-3 text-rose-900"><span className="font-medium">Cancellation reason: </span>{b.cancellationReason}</p>}
        </div>

        {TRANSITIONS[b.bookingStatus]?.length > 0 && (
          <div className="space-y-3 rounded-xl border p-4">
            <Label htmlFor="note">Update status</Label>
            <Textarea id="note" rows={2} placeholder="Optional note to the guest (included in the email)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            <div className="flex flex-wrap gap-2">
              {TRANSITIONS[b.bookingStatus].map(([s, label, I]) => (
                <Button key={s} size="sm" variant={s === 'confirmed' || s === 'completed' ? 'default' : 'outline'} disabled={!!busy}
                  className={s === 'rejected' || s === 'cancelled' ? 'text-destructive' : ''}
                  onClick={() => run(s, () => adminUpdateBooking({ bookingId: b.bookingId, status: s, note }), `Booking ${STATUS_STYLES[s].label.toLowerCase()}`).then(() => setNote(''))}>
                  {busy === s ? <Spinner className="size-4 text-current" /> : <I />} {label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Rejecting or cancelling releases the dates immediately. Guests are notified by email (if the email extension is installed).</p>
          </div>
        )}

        <div className="rounded-xl border p-4"><PriceBreakdown pricing={b.pricing} /></div>

        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">Payments</p><p className="text-sm">Paid {formatCurrency(b.amountPaid || 0, c)} · Due <span className="font-semibold">{formatCurrency(due, c)}</span></p></div>
          {payments?.length > 0 && (
            <ul className="divide-y text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{formatCurrency(p.amount, c)} <span className="text-xs text-muted-foreground">· {p.method || p.mode} · {formatDate(p.createdAt, 'dd MMM HH:mm')}</span><span className="block font-mono text-[11px] text-muted-foreground">{p.gatewayPaymentId || p.reference}</span></span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={p.status === 'captured' ? 'paid' : p.status} />
                    {p.gatewayPaymentId && p.status === 'captured' && (p.amountRefunded || 0) < p.amount && (
                      <Button size="xs" variant="outline" disabled={!!busy} onClick={() => {
                        const amt = Number(refundAmount) || p.amount - (p.amountRefunded || 0)
                        run('refund' + p.id, () => adminRefundPayment({ bookingId: b.bookingId, paymentId: p.id, amount: amt }), 'Refund initiated')
                      }}>{busy === 'refund' + p.id ? <Spinner className="size-3" /> : <Undo2 />} Refund</Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {payments?.some((p) => p.gatewayPaymentId && p.status === 'captured') && (
            <Input type="number" min="1" placeholder="Refund amount (blank = full remaining)" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="h-9" />
          )}
          {['confirmed', 'completed'].includes(b.bookingStatus) && due > 0 && (
            <div className="grid gap-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">Record an offline payment (cash / bank transfer / UPI to account)</p>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input type="number" min="1" max={due} placeholder="Amount" value={offline.amount} onChange={(e) => setOffline({ ...offline, amount: e.target.value })} className="h-9" />
                <Select value={offline.method} onValueChange={(v) => setOffline({ ...offline, method: v })}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{['cash', 'bank_transfer', 'upi', 'card_terminal'].map((m) => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" className="h-9" disabled={!!busy || !(Number(offline.amount) > 0)}
                  onClick={() => run('offline', () => adminRecordOfflinePayment({ bookingId: b.bookingId, amount: Number(offline.amount), method: offline.method, reference: offline.reference }), 'Payment recorded').then(() => setOffline({ amount: '', reference: '', method: 'cash' }))}>
                  {busy === 'offline' ? <Spinner className="size-4 text-current" /> : <Wallet />} Record
                </Button>
              </div>
              <Input placeholder="Reference / receipt no. (optional)" value={offline.reference} onChange={(e) => setOffline({ ...offline, reference: e.target.value })} className="h-9" />
            </div>
          )}
          <div className="flex items-center gap-2 border-t pt-4">
            <Label className="text-xs text-muted-foreground">Override payment status</Label>
            <Select value={b.paymentStatus} onValueChange={(v) => run('ps', () => adminUpdateBooking({ bookingId: b.bookingId, paymentStatus: v }), 'Payment status updated')}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_STYLES[s].label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border p-4"><p className="mb-4 text-sm font-semibold">Timeline</p><BookingTimeline booking={b} /></div>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </SheetContent>
  )
}

export default function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const { data, loading, error, refetch } = useApi(['admin', 'bookings'], '/admin/bookings', { select: (r) => r.items, refetchInterval: 30_000 })
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const status = params.get('status') || 'all'

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data || []).filter((b) =>
      (status === 'all' || (status === 'cancellation' ? b.cancellationRequested && b.bookingStatus === 'confirmed' : b.bookingStatus === status)) &&
      (!from || b.checkIn >= from) && (!to || b.checkIn <= to) &&
      (!q || [b.bookingId, b.guestName, b.email, b.phone, b.accommodationName].some((v) => v?.toLowerCase().includes(q))))
  }, [data, search, status, from, to])
  const selected = data?.find((b) => b.id === selectedId)

  const exportCsv = () => {
    const csv = toCsv(rows, [
      { label: 'Booking ID', value: 'bookingId' }, { label: 'Guest', value: 'guestName' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' },
      { label: 'Accommodation', value: 'accommodationName' }, { label: 'Check-in', value: 'checkIn' }, { label: 'Check-out', value: 'checkOut' }, { label: 'Nights', value: 'nights' },
      { label: 'Adults', value: 'adults' }, { label: 'Children', value: 'children' }, { label: 'Total', value: 'totalAmount' }, { label: 'Paid', value: (r) => r.amountPaid || 0 },
      { label: 'Refunded', value: (r) => r.amountRefunded || 0 }, { label: 'Booking status', value: 'bookingStatus' }, { label: 'Payment status', value: 'paymentStatus' },
      { label: 'Created', value: (r) => formatDate(r.createdAt, 'yyyy-MM-dd HH:mm') }, { label: 'Special requests', value: 'specialRequests' },
    ])
    downloadFile(csv, `bookings-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ID, guest, email, phone…" className="lg:w-80" />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={(v) => setParams(v === 'all' ? {} : { status: v })}>
            <SelectTrigger className="h-10 w-44 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_STYLES[s].label}</SelectItem>)}
              <SelectItem value="cancellation">Cancellation requested</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Check-in</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 w-36 bg-white" aria-label="Check-in from" />
            <span>to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 w-36 bg-white" aria-label="Check-in to" />
            {(from || to) && <Button variant="ghost" size="icon-sm" onClick={() => { setFrom(''); setTo('') }} aria-label="Clear dates"><CalendarX2 /></Button>}
          </div>
          <Button variant="outline" className="h-10" onClick={exportCsv} disabled={!rows.length}><Download /> Export CSV</Button>
        </div>
      </div>

      <Panel className="overflow-hidden [&>div]:p-0 sm:[&>div]:p-0">
        {loading ? <div className="space-y-2 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> : !rows.length ? (
          <EmptyState title={data?.length ? 'No bookings match your filters' : 'No bookings yet'} className="m-5 border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5">Booking</TableHead><TableHead>Guest</TableHead><TableHead>Stay</TableHead><TableHead>Dates</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="pr-5">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => setSelectedId(b.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelectedId(b.id)}>
                  <TableCell className="pl-5 font-mono text-xs">{b.bookingId}<span className="block font-sans text-[11px] text-muted-foreground">{formatDate(b.createdAt, 'dd MMM, HH:mm')}</span></TableCell>
                  <TableCell><span className="font-medium">{b.guestName}</span><span className="block text-xs text-muted-foreground">{b.email}</span></TableCell>
                  <TableCell className="max-w-40 truncate">{b.accommodationName}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(b.checkIn, 'dd MMM')} → {formatDate(b.checkOut, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(b.totalAmount, b.pricing?.currency)}</TableCell>
                  <TableCell><StatusBadge status={b.bookingStatus} />{b.cancellationRequested && b.bookingStatus === 'confirmed' && <span className="ml-1 text-[10px] text-rose-700">• cancel req.</span>}</TableCell>
                  <TableCell className="pr-5"><StatusBadge status={b.paymentStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
      <p className="text-xs text-muted-foreground">{rows.length} of {data?.length || 0} bookings</p>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        {selected && <BookingDetail booking={selected} onClose={() => setSelectedId(null)} />}
      </Sheet>
    </div>
  )
}
