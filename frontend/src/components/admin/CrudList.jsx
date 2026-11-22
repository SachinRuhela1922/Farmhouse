import { useMemo, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/common/Primitives'
import { useAdminCollection } from '@/hooks/useContent'
import { useInvalidate } from '@/hooks/useApi'
import { Panel, SearchInput, ActiveToggle, ReorderButtons, ConfirmButton, moveItem } from './AdminUi'

/**
 * Generic admin list for ordered content collections (experiences, testimonials, FAQs, accommodations…).
 * - live data from Firestore
 * - search, publish toggle, reorder, edit (dialog), delete (confirm)
 */
export function CrudList({ api, collectionName, title, noun, activeField = 'isActive', searchFields = [], renderRow, FormComponent, emptyIcon, onDelete, dialogClassName = 'sm:max-w-2xl' }) {
  const { data, loading, error, refetch } = useAdminCollection(collectionName)
  const invalidate = useInvalidate()
  const refresh = () => invalidate(['admin', 'content', collectionName], ['public', collectionName])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null | {} (new) | item
  const items = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (data || []).filter((it) => !q || searchFields.some((f) => String(it[f] || '').toLowerCase().includes(q)))
  }, [data, search, searchFields])

  const move = async (from, to) => {
    const ids = moveItem(data.map((d) => d.id), from, to)
    try { await api.reorder(ids); await refresh() } catch (e) { toast.error(e.message) }
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}…`} className="sm:w-72" />
        <Button onClick={() => setEditing({})}><Plus /> Add {noun}</Button>
      </div>
      <Panel className="[&>div]:p-0 sm:[&>div]:p-0">
        {loading ? <div className="space-y-2 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div> : !items.length ? (
          <EmptyState icon={emptyIcon} title={data?.length ? 'Nothing matches your search' : `No ${title.toLowerCase()} yet`} description={data?.length ? undefined : `Add your first ${noun} to show it on the website.`} className="m-5 border-0" action={!data?.length && <Button onClick={() => setEditing({})}><Plus /> Add {noun}</Button>} />
        ) : (
          <ul className="divide-y">
            {items.map((it) => {
              const idx = data.findIndex((d) => d.id === it.id)
              return (
                <li key={it.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  {!search && <ReorderButtons index={idx} total={data.length} onMove={move} />}
                  <div className="min-w-0 flex-1">{renderRow(it)}</div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <ActiveToggle checked={it[activeField]} label={`Toggle ${noun} visibility`} onChange={(v) => api.patch(it.id, { [activeField]: v }).then(refresh).then(() => toast.success(v ? 'Published' : 'Hidden from website'))} />
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(it)} aria-label={`Edit ${noun}`}><Pencil /></Button>
                    <ConfirmButton title={`Delete this ${noun}?`} description="It will be permanently removed from the website." onConfirm={async () => { await (onDelete ? onDelete(it) : api.remove(it.id)); await refresh(); toast.success('Deleted') }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className={`max-h-[92dvh] overflow-y-auto ${dialogClassName}`}>
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-medium">{editing?.id ? `Edit ${noun}` : `New ${noun}`}</DialogTitle>
            <DialogDescription>Changes appear on the website immediately after saving.</DialogDescription>
          </DialogHeader>
          {editing && (
            <FormComponent
              initial={editing}
              nextOrder={data?.length || 0}
              onCancel={() => setEditing(null)}
              onSave={async (values) => {
                if (editing.id) await api.update(editing.id, values)
                else await api.create(values)
                await refresh()
                toast.success(editing.id ? 'Saved' : `${noun[0].toUpperCase() + noun.slice(1)} added`)
                setEditing(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function FormActions({ onCancel, submitting, label = 'Save' }) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
      <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={submitting}>{submitting && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />} {label}</Button>
    </div>
  )
}
