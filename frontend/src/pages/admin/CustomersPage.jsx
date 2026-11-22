import { useMemo, useState } from 'react'
import { Users, Mail, Phone, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Panel, SearchInput } from '@/components/admin/AdminUi'
import { StatusBadge, EmptyState, ErrorState, Spinner } from '@/components/common/Primitives'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate, initials, toCsv, downloadFile, telLink } from '@/utils/format'

function CustomerDetail({ id }) {
  const { data, loading } = useApi(['admin', 'customers', id], `/admin/customers/${id}`)
  if (loading || !data) return <div className="grid h-60 place-items-center"><Spinner /></div>
  const { user, bookings } = data
  const paid = bookings.reduce((t, b) => t + (b.amountPaid || 0) - (b.amountRefunded || 0), 0)
  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="font-serif text-3xl font-medium">{user.fullName}</SheetTitle>
        <SheetDescription>Customer since {formatDate(user.createdAt, 'MMMM yyyy')} · {user.role === 'admin' ? 'Administrator' : 'Customer'} · {user.emailVerified ? 'email verified' : 'email not verified'}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 p-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><a href={`mailto:${user.email}`}><Mail /> {user.email}</a></Button>
          {user.phone && <Button asChild variant="outline" size="sm"><a href={telLink(user.phone)}><Phone /> {user.phone}</a></Button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-cream p-4"><p className="text-xs text-muted-foreground">Bookings</p><p className="font-serif text-3xl">{bookings.length}</p></div>
          <div className="rounded-xl bg-cream p-4"><p className="text-xs text-muted-foreground">Total paid</p><p className="font-serif text-3xl">{formatCurrency(paid)}</p></div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Booking history</p>
          {!bookings.length ? <p className="text-sm text-muted-foreground">No bookings yet.</p> : (
            <ul className="divide-y rounded-xl border">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span><span className="font-medium">{b.accommodationName}</span><span className="block text-xs text-muted-foreground">{b.bookingId} · {formatDate(b.checkIn, 'dd MMM yy')} → {formatDate(b.checkOut, 'dd MMM yy')}</span></span>
                  <span className="text-right"><StatusBadge status={b.bookingStatus} /><span className="mt-1 block text-xs tabular-nums">{formatCurrency(b.totalAmount)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

export default function CustomersPage() {
  const { data: users, loading, error, refetch } = useApi(['admin', 'customers'], '/admin/customers', { select: (r) => r.items })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (users || []).filter((u) => !q || [u.fullName, u.email, u.phone].some((v) => v?.toLowerCase().includes(q)))
  }, [users, search])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone…" className="sm:w-80" />
        <Button variant="outline" disabled={!rows.length} onClick={() => downloadFile(toCsv(rows, [
          { label: 'Name', value: 'fullName' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Role', value: 'role' },
          { label: 'Verified', value: (u) => (u.emailVerified ? 'yes' : 'no') }, { label: 'Bookings', value: 'bookingCount' }, { label: 'Paid', value: 'totalPaid' },
          { label: 'Joined', value: (u) => formatDate(u.createdAt, 'yyyy-MM-dd') },
        ]), 'customers.csv')}><Download /> Export CSV</Button>
      </div>
      <Panel className="overflow-hidden [&>div]:p-0 sm:[&>div]:p-0">
        {loading ? <div className="space-y-2 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div> : !rows.length ? <EmptyState icon={Users} title="No customers found" className="m-5 border-0" /> : (
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="pl-5">Customer</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="pr-5">Joined</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => setSelected(u.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(u.id)}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="size-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">{initials(u.fullName || u.email)}</span>}
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{u.fullName || '—'} {u.role === 'admin' && <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">admin</span>}</span>
                        <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{u.phone || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.bookingCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(u.totalPaid)}</TableCell>
                  <TableCell className="pr-5 text-sm">{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{selected && <CustomerDetail id={selected} />}</SheetContent>
      </Sheet>
    </div>
  )
}
