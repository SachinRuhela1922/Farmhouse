import { useMemo, useState } from 'react'
import { Mail, Download, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Panel, SearchInput, ConfirmButton, ActiveToggle } from '@/components/admin/AdminUi'
import { StatusBadge, EmptyState, ErrorState } from '@/components/common/Primitives'
import { useApi, useInvalidate } from '@/hooks/useApi'
import { newsletterAdmin } from '@/services/content/contentService'
import { formatDate, toCsv, downloadFile } from '@/utils/format'

export default function NewsletterPage() {
  const { data, loading, error } = useApi(['admin', 'newsletter'], '/admin/newsletter', { select: (r) => r.items })
  const invalidate = useInvalidate()
  const [search, setSearch] = useState('')
  const rows = useMemo(() => (data || []).filter((s) => !search || s.email.includes(search.toLowerCase().trim())), [data, search])
  const active = (data || []).filter((s) => s.status === 'subscribed')

  if (error) return <ErrorState error={error} />
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/60"><p className="text-sm text-muted-foreground">Active subscribers</p><p className="font-serif text-4xl">{active.length}</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/60"><p className="text-sm text-muted-foreground">Unsubscribed</p><p className="font-serif text-4xl">{(data?.length || 0) - active.length}</p></div>
      </div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search email…" className="sm:w-72" />
        <div className="flex gap-2">
          <Button variant="outline" disabled={!active.length} onClick={() => { navigator.clipboard.writeText(active.map((s) => s.email).join(', ')); toast.success(`${active.length} emails copied`) }}><Copy /> Copy active emails</Button>
          <Button variant="outline" disabled={!rows.length} onClick={() => downloadFile(toCsv(rows, [{ label: 'Email', value: 'email' }, { label: 'Status', value: 'status' }, { label: 'Subscribed', value: (r) => formatDate(r.subscribedAt, 'yyyy-MM-dd') }]), 'newsletter.csv')}><Download /> Export CSV</Button>
        </div>
      </div>
      <Panel className="overflow-hidden [&>div]:p-0 sm:[&>div]:p-0">
        {loading ? <div className="space-y-2 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div> : !rows.length ? <EmptyState icon={Mail} title="No subscribers yet" className="m-5 border-0" /> : (
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="pl-5">Email</TableHead><TableHead>Subscribed</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-5 font-medium">{s.email}</TableCell>
                  <TableCell>{formatDate(s.subscribedAt)}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-2">
                      <ActiveToggle checked={s.status === 'subscribed'} label="Subscribed" onChange={(v) => newsletterAdmin.setStatus(s.id, v ? 'subscribed' : 'unsubscribed').then(() => invalidate('admin'))} />
                      <ConfirmButton title="Remove subscriber?" onConfirm={async () => { await newsletterAdmin.remove(s.id); await invalidate('admin'); toast.success('Removed') }} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
