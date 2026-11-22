import { useMemo, useState } from 'react'
import { Inbox, Mail, Phone, Reply } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Panel, SearchInput, ConfirmButton } from '@/components/admin/AdminUi'
import { StatusBadge, EmptyState, ErrorState } from '@/components/common/Primitives'
import { WhatsAppIcon } from '@/components/common/BrandIcons'
import { useApi, useInvalidate } from '@/hooks/useApi'
import { contactsAdmin } from '@/services/content/contentService'
import { CONTACT_STATUSES, STATUS_STYLES } from '@/utils/constants'
import { formatDate, telLink, whatsappLink } from '@/utils/format'
import { cn } from '@/lib/utils'

export default function ContactsPage() {
  const { data, loading, error, refetch } = useApi(['admin', 'contacts'], '/admin/contacts', { select: (r) => r.items, refetchInterval: 30_000 })
  const invalidate = useInvalidate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [openId, setOpenId] = useState(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data || []).filter((c) => (status === 'all' || c.status === status) && (!q || [c.name, c.email, c.subject, c.message].some((v) => v?.toLowerCase().includes(q))))
  }, [data, search, status])

  const open = async (c) => {
    setOpenId(openId === c.id ? null : c.id)
    if (c.status === 'new') contactsAdmin.setStatus(c.id, 'read').then(() => invalidate('admin')).catch(() => {})
  }
  const setStatusFor = (id, s) => contactsAdmin.setStatus(id, s).then(() => invalidate('admin')).then(() => toast.success(`Marked ${STATUS_STYLES[s].label.toLowerCase()}`)).catch((e) => toast.error(e.message))

  if (error) return <ErrorState error={error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search messages…" className="sm:w-80" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All messages</SelectItem>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_STYLES[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Panel className="[&>div]:p-0 sm:[&>div]:p-0">
        {loading ? <div className="space-y-2 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div> : !rows.length ? <EmptyState icon={Inbox} title="Inbox zero" description="No messages match this view." className="m-5 border-0" /> : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li key={c.id} className={cn(c.status === 'new' && 'bg-amber-50/40')}>
                <button onClick={() => open(c)} className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-muted/40" aria-expanded={openId === c.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className={cn('text-sm', c.status === 'new' ? 'font-semibold' : 'font-medium')}>{c.name}</span><span className="text-xs text-muted-foreground">{c.email}</span></div>
                    <p className="mt-0.5 truncate text-sm">{c.subject && <span className="font-medium">{c.subject} — </span>}<span className="text-muted-foreground">{c.message}</span></p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1"><StatusBadge status={c.status} /><span className="text-[11px] text-muted-foreground">{formatDate(c.createdAt, 'dd MMM, HH:mm')}</span></div>
                </button>
                {openId === c.id && (
                  <div className="space-y-4 border-t bg-cream/40 px-5 py-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed">{c.message}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm"><a href={`mailto:${c.email}?subject=${encodeURIComponent('Re: ' + (c.subject || 'Your enquiry'))}`} onClick={() => setStatusFor(c.id, 'replied')}><Reply /> Reply by email</a></Button>
                      {c.phone && <Button asChild size="sm" variant="outline"><a href={telLink(c.phone)}><Phone /> {c.phone}</a></Button>}
                      {c.phone && whatsappLink(c.phone) && <Button asChild size="sm" variant="outline"><a href={whatsappLink(c.phone, `Hello ${c.name}, thank you for your enquiry.`)} target="_blank" rel="noreferrer"><WhatsAppIcon className="text-[#25D366]" /> WhatsApp</a></Button>}
                      <Select value={c.status} onValueChange={(s) => setStatusFor(c.id, s)}>
                        <SelectTrigger className="h-8 w-36 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_STYLES[s].label}</SelectItem>)}</SelectContent>
                      </Select>
                      <span className="ml-auto"><ConfirmButton title="Delete this enquiry?" onConfirm={async () => { await contactsAdmin.remove(c.id); await invalidate('admin'); toast.success('Deleted') }} /></span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="size-3" /> {c.email}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
