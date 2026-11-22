import { useMemo, useRef, useState } from 'react'
import { Upload, Images, Film, Link2, Plus, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Panel, ActiveToggle, ConfirmButton, ReorderButtons, moveItem } from '@/components/admin/AdminUi'
import { Img, EmptyState, ErrorState, Spinner } from '@/components/common/Primitives'
import { useAdminCollection } from '@/hooks/useContent'
import { useInvalidate } from '@/hooks/useApi'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { galleryApi, uploadGalleryItem, deleteGalleryItem } from '@/services/gallery/galleryService'
import { saveSettings } from '@/services/content/contentService'
import { SETTINGS_KEY } from '@/context/SiteSettingsContext'
import { toEmbedUrl } from '@/components/common/VideoShowcase'
import { cn } from '@/lib/utils'

function CategoryManager({ categories }) {
  const [text, setText] = useState('')
  const invalidate = useInvalidate()
  const save = async (list) => { try { await saveSettings({ galleryCategories: list }); await invalidate(SETTINGS_KEY); toast.success('Categories updated') } catch (e) { toast.error(e.message) } }
  return (
    <Panel title="Categories" description="Used for filtering on the public gallery">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
            {c}
            <button onClick={() => save(categories.filter((x) => x !== c))} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${c}`}>×</button>
          </span>
        ))}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = text.trim(); if (v && !categories.includes(v)) save([...categories, v]); setText('') }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="New category" className="h-9" maxLength={30} />
        <Button size="sm" className="h-9" type="submit"><Plus /> Add</Button>
      </form>
    </Panel>
  )
}

function EditItem({ item, categories, onClose }) {
  const invalidate = useInvalidate()
  const [title, setTitle] = useState(item.title || '')
  const [category, setCategory] = useState(item.category || categories[0])
  const [busy, setBusy] = useState(false)
  return (
    <form className="grid gap-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true)
      try { await galleryApi.patch(item.id, { title: title.trim(), category }); await invalidate(['admin', 'content', 'gallery'], ['public', 'gallery']); toast.success('Saved'); onClose() } catch (err) { toast.error(err.message) } finally { setBusy(false) }
    }}>
      <div className="grid gap-2"><Label htmlFor="gt">Title</Label><Input id="gt" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></div>
      <div className="grid gap-2"><Label>Category</Label>
        <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{[...new Set([...categories, item.category].filter(Boolean))].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={busy}>{busy && <Spinner className="size-4 text-current" />} Save</Button></div>
    </form>
  )
}

export default function GalleryAdminPage() {
  const { data, loading, error } = useAdminCollection('gallery')
  const invalidate = useInvalidate()
  const refresh = () => invalidate(['admin', 'content', 'gallery'], ['public', 'gallery'])
  const { settings } = useSiteSettings()
  const categories = settings.galleryCategories
  const [filter, setFilter] = useState('All')
  const [uploadCat, setUploadCat] = useState(categories[0] || 'Uncategorised')
  const [progress, setProgress] = useState(null)
  const [editing, setEditing] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const fileRef = useRef(null)

  const items = useMemo(() => (data || []).filter((g) => filter === 'All' || g.category === filter || (filter === 'Videos' && g.type === 'video')), [data, filter])

  const upload = async (files) => {
    const list = Array.from(files)
    let order = data?.length || 0
    for (const [i, f] of list.entries()) {
      try {
        setProgress({ n: i + 1, total: list.length, pct: 0 })
        await uploadGalleryItem(f, { category: uploadCat, displayOrder: order++ }, (pct) => setProgress({ n: i + 1, total: list.length, pct }))
      } catch (e) {
        toast.error(`${f.name}: ${e.message}`)
      }
    }
    setProgress(null)
    await refresh()
    toast.success(`${list.length} file${list.length > 1 ? 's' : ''} uploaded`)
  }

  const addVideoLink = async (e) => {
    e.preventDefault()
    if (!toEmbedUrl(videoUrl)) return toast.error('Enter a valid YouTube or Vimeo link.')
    await galleryApi.create({ type: 'video', imageUrl: videoUrl.trim(), category: uploadCat, title: 'Video', displayOrder: data?.length || 0, isActive: true })
    setVideoUrl('')
    await refresh()
    toast.success('Video added')
  }

  const move = async (from, to) => {
    const ids = moveItem(data.map((d) => d.id), from, to)
    try { await galleryApi.reorder(ids); await refresh() } catch (e) { toast.error(e.message) }
  }

  if (error) return <ErrorState error={error} />
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Upload media" description="Images are resized & converted to WebP automatically. Videos up to 100 MB.">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2"><Label>Category</Label>
              <Select value={uploadCat} onValueChange={setUploadCat}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button onClick={() => fileRef.current?.click()} disabled={!!progress}>{progress ? <Spinner className="size-4 text-current" /> : <Upload />} {progress ? `Uploading ${progress.n}/${progress.total} · ${progress.pct}%` : 'Upload images / videos'}</Button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files) }}
            className="mt-4 grid place-items-center rounded-xl border-2 border-dashed py-8 text-sm text-muted-foreground"
          >
            <Images className="mb-2 size-6" /> Drag & drop files here
          </div>
          <form onSubmit={addVideoLink} className="mt-4 flex gap-2">
            <div className="relative flex-1"><Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="…or paste a YouTube / Vimeo link" className="h-9 pl-9" /></div>
            <Button type="submit" variant="outline" size="sm" className="h-9"><Film /> Add video</Button>
          </form>
        </Panel>
        <CategoryManager categories={categories} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...categories, 'Videos'].map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={cn('rounded-full px-4 py-1.5 text-sm ring-1 transition', filter === c ? 'bg-primary text-primary-foreground ring-primary' : 'bg-white ring-border')}>{c}</button>
        ))}
      </div>

      {loading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div> : !items.length ? (
        <EmptyState icon={Images} title="No media here yet" description="Upload images or add video links above." />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((g) => {
            const idx = data.findIndex((d) => d.id === g.id)
            return (
              <div key={g.id} className={cn('overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-border/60', !g.isActive && 'opacity-60')}>
                <div className="relative aspect-[4/3] bg-muted">
                  {g.type === 'video' ? (
                    toEmbedUrl(g.imageUrl) ? <div className="grid size-full place-items-center text-muted-foreground"><Film className="size-8" /></div> : <video src={g.imageUrl} className="size-full object-cover" muted />
                  ) : <Img src={g.imageUrl} alt={g.title} className="size-full" width={500} />}
                  {g.type === 'video' && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">Video</span>}
                </div>
                <div className="flex items-start gap-2 p-3">
                  {filter === 'All' && <ReorderButtons index={idx} total={data.length} onMove={move} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">{g.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground"><ActiveToggle checked={g.isActive} label="Publish" onChange={(v) => galleryApi.patch(g.id, { isActive: v }).then(refresh)} />{g.isActive ? <><Check className="size-3" /> Live</> : 'Hidden'}</span>
                  <span className="flex">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(g)} aria-label="Edit"><Pencil /></Button>
                    <ConfirmButton title="Delete this item?" description="The file will be removed from storage." onConfirm={async () => { await deleteGalleryItem(g); await refresh(); toast.success('Deleted') }} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit media</DialogTitle><DialogDescription>Update the title and category.</DialogDescription></DialogHeader>
          {editing && <EditItem item={editing} categories={categories} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
