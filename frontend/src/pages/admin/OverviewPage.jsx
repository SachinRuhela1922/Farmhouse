import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, Clock, CheckCircle2, Users, IndianRupee, BedDouble, ArrowUpRight, Table2, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/admin/AdminUi'
import { StatusBadge, EmptyState, ErrorState } from '@/components/common/Primitives'
import { useApi } from '@/hooks/useApi'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { formatCurrency, formatDate } from '@/utils/format'
import { BOOKING_STATUSES, STATUS_STYLES } from '@/utils/constants'
import { cn } from '@/lib/utils'

function StatTile({ icon: I, label, value, hint, to, loading }) {
  const body = (
    <div className="group h-full rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/60 transition hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className="grid size-8 place-items-center rounded-full bg-accent text-primary"><I className="size-4" /></span>
      </div>
      {loading ? <Skeleton className="mt-3 h-9 w-24" /> : <p className="mt-3 font-serif text-4xl tabular-nums">{value}</p>}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

function ChartTooltip({ active, payload, label, money, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lift ring-1 ring-border">
      <p className="font-medium">{label}</p>
      <p className="mt-0.5 tabular-nums text-muted-foreground">{money ? formatCurrency(payload[0].value, currency) : `${payload[0].value} bookings`}</p>
    </div>
  )
}

/** All numbers are aggregated in MongoDB by GET /api/admin/stats. */
export default function OverviewPage() {
  const { settings } = useSiteSettings()
  const currency = settings.bookingSettings.currency
  const { data: s, loading, error, refetch } = useApi(['admin', 'stats'], '/admin/stats', { refetchInterval: 60_000 })
  const [tableView, setTableView] = useState(false)

  if (error) return <ErrorState error={error} onRetry={refetch} />
  const total = s?.total || 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile icon={CalendarDays} label="Total bookings" value={total} loading={loading} to="/admin/bookings" />
        <StatTile icon={Clock} label="Pending" value={s?.pending ?? 0} hint="Awaiting your decision" loading={loading} to="/admin/bookings?status=pending" />
        <StatTile icon={CheckCircle2} label="Confirmed" value={s?.confirmed ?? 0} loading={loading} to="/admin/bookings?status=confirmed" />
        <StatTile icon={Users} label="Customers" value={s?.customers ?? 0} loading={loading} to="/admin/customers" />
        <StatTile icon={IndianRupee} label="Revenue received" value={formatCurrency(s?.revenue || 0, currency)} hint="Paid on confirmed/completed, net of refunds" loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Booking trends" description="New booking requests per month (excluding rejected), last 12 months"
          actions={<Button variant="ghost" size="sm" onClick={() => setTableView((t) => !t)}>{tableView ? <><BarChart3 /> Chart</> : <><Table2 /> Table</>}</Button>}>
          {loading ? <Skeleton className="h-64" /> : tableView ? (
            <div className="max-h-72 overflow-auto text-sm">
              <table className="w-full">
                <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-2 font-medium">Month</th><th className="pb-2 text-right font-medium">Bookings</th><th className="pb-2 text-right font-medium">Revenue</th></tr></thead>
                <tbody>{s.monthly.map((m) => <tr key={m.key} className="border-t"><td className="py-1.5">{m.month}</td><td className="text-right tabular-nums">{m.bookings}</td><td className="text-right tabular-nums">{formatCurrency(m.revenue, currency)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.monthly} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltip />} />
                  <Bar dataKey="bookings" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Occupancy — this month" description={`${s?.occupancy?.bookedNights ?? 0} booked nights across ${s?.occupancy?.activeStays ?? 0} active stays`}>
          {loading ? <Skeleton className="h-64" /> : (
            <div>
              <p className="font-serif text-6xl tabular-nums">{s.occupancy.pct}<span className="text-3xl text-muted-foreground">%</span></p>
              <p className="text-xs text-muted-foreground">Includes pending requests</p>
              <ul className="mt-6 space-y-4">
                {s.occupancy.perStay.map((st) => (
                  <li key={st.name}>
                    <div className="mb-1.5 flex justify-between text-sm"><span>{st.name}</span><span className="tabular-nums text-muted-foreground">{st.pct}% · {st.nights} nights</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-1)] transition-all" style={{ width: `${Math.min(st.pct, 100)}%` }} /></div>
                  </li>
                ))}
                {!s.occupancy.perStay.length && <li className="text-sm text-muted-foreground">No active accommodations.</li>}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Revenue received" description="Payments on confirmed & completed bookings, net of refunds, by booking month">
          {loading ? <Skeleton className="h-56" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.monthly} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="rev" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <Tooltip cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }} content={<ChartTooltip money currency={currency} />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel title="Bookings by status">
          <ul className="space-y-3">
            {BOOKING_STATUSES.map((st) => {
              const n = s?.byStatus?.[st] || 0
              return (
                <li key={st}>
                  <div className="mb-1 flex items-center justify-between text-sm"><StatusBadge status={st} /><span className="tabular-nums">{n}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', STATUS_STYLES[st].dot)} style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent bookings" actions={<Button asChild variant="ghost" size="sm"><Link to="/admin/bookings">View all <ArrowUpRight /></Link></Button>}>
          {loading ? <Skeleton className="h-48" /> : !s.recentBookings.length ? <EmptyState icon={BedDouble} title="No bookings yet" className="border-0 py-10" /> : (
            <ul className="-my-2 divide-y">
              {s.recentBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.guestName} <span className="font-mono text-xs text-muted-foreground">· {b.bookingId}</span></p>
                    <p className="text-xs text-muted-foreground">{b.accommodationName} · {formatDate(b.checkIn, 'dd MMM')} → {formatDate(b.checkOut, 'dd MMM')}</p>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-sm tabular-nums">{formatCurrency(b.totalAmount, currency)}</span><StatusBadge status={b.bookingStatus} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent enquiries" actions={<Button asChild variant="ghost" size="sm"><Link to="/admin/contacts">Inbox <ArrowUpRight /></Link></Button>}>
          {!s?.recentContacts?.length ? <p className="text-sm text-muted-foreground">No enquiries yet.</p> : (
            <ul className="-my-2 divide-y">
              {s.recentContacts.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{c.name}</p><StatusBadge status={c.status} /></div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{c.subject || c.message}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(c.createdAt, 'dd MMM, HH:mm')}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
