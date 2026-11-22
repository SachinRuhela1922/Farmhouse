import { useRef, useState } from 'react'
import { Search, Trash2, ArrowUp, ArrowDown, Upload, X, ImagePlus, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Img, Spinner } from '@/components/common/Primitives'
import { uploadMedia } from '@/services/storage/uploadService'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {title && <h2 className="text-3xl">{title}</h2>}
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, description, actions, children, className }) {
  return (
    <section className={cn('rounded-2xl bg-white shadow-soft ring-1 ring-border/60', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div>
            {title && <h3 className="font-sans text-[15px] font-semibold tracking-normal">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 bg-white pl-9" aria-label={placeholder} />
    </div>
  )
}

export function ConfirmButton({ onConfirm, title = 'Are you sure?', description = 'This action cannot be undone.', confirmLabel = 'Delete', children, variant = 'ghost', size = 'icon-sm', className, label = 'Delete' }) {
  const [busy, setBusy] = useState(false)
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant={variant} size={size} className={cn('text-muted-foreground hover:text-destructive', className)} aria-label={label}>{children || <Trash2 />}</Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try { await onConfirm() } catch (e) { toast.error(e.message || 'Action failed') } finally { setBusy(false) }
            }}
          >
            {busy && <Spinner className="size-4 text-current" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Toggle a boolean field with optimistic feedback. */
export function ActiveToggle({ checked, onChange, label }) {
  const [busy, setBusy] = useState(false)
  return (
    <Switch
      checked={!!checked}
      disabled={busy}
      aria-label={label}
      onCheckedChange={async (v) => {
        setBusy(true)
        try { await onChange(v) } catch (e) { toast.error(e.message || 'Update failed') } finally { setBusy(false) }
      }}
    />
  )
}

/** Up/down reorder controls operating on an ordered id list. */
export function ReorderButtons({ index, total, onMove }) {
  return (
    <div className="flex flex-col">
      <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
      <button type="button" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
    </div>
  )
}

export function moveItem(list, from, to) {
  const next = [...list]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

/**
 * Multi-image manager for forms: upload (with progress), remove, reorder, set cover.
 * Value: [{ url, mediaId }] — files are stored in MongoDB GridFS via the API.
 */
export function ImageListInput({ value = [], onChange, folder, max = 12, single = false }) {
  const inputRef = useRef(null)
  const [uploads, setUploads] = useState([]) // [{ name, progress }]

  const onFiles = async (files) => {
    const list = Array.from(files).slice(0, single ? 1 : max - value.length)
    if (!list.length) return
    let acc = single ? [] : [...value]
    for (const f of list) {
      const key = f.name + Date.now()
      setUploads((u) => [...u, { key, name: f.name, progress: 0 }])
      try {
        const { url, mediaId } = await uploadMedia(f, folder, { onProgress: (p) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, progress: p } : x))) })
        acc = [...acc, { url, mediaId }]
        onChange(acc)
      } catch (e) {
        toast.error(`${f.name}: ${e.message}`)
      } finally {
        setUploads((u) => u.filter((x) => x.key !== key))
      }
    }
  }

  return (
    <div>
      <div className={cn('grid gap-3', single ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4')}>
        {value.map((im, i) => (
          <div key={im.url + i} className={cn('group relative overflow-hidden rounded-xl ring-1 ring-border', single ? 'aspect-[16/9]' : 'aspect-square')}>
            <Img src={im.url} alt="" className="size-full" width={400} />
            {i === 0 && !single && <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold">Cover</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              {!single && (
                <span className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => onChange(moveItem(value, i, i - 1))} className="grid size-7 place-items-center rounded-full bg-white/90 disabled:opacity-40" aria-label="Move left"><ArrowUp className="size-3.5 -rotate-90" /></button>
                  <button type="button" disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, i + 1))} className="grid size-7 place-items-center rounded-full bg-white/90 disabled:opacity-40" aria-label="Move right"><ArrowDown className="size-3.5 -rotate-90" /></button>
                </span>
              )}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="ml-auto grid size-7 place-items-center rounded-full bg-white/90 text-destructive" aria-label="Remove image"><X className="size-3.5" /></button>
            </div>
          </div>
        ))}
        {uploads.map((u) => (
          <div key={u.key} className={cn('grid place-items-center rounded-xl bg-muted text-xs text-muted-foreground', single ? 'aspect-[16/9]' : 'aspect-square')}>
            <div className="w-3/4 text-center"><Spinner className="mx-auto mb-2 size-4" />{u.progress}%<div className="mt-1 h-1 overflow-hidden rounded bg-border"><div className="h-full bg-primary transition-all" style={{ width: `${u.progress}%` }} /></div></div>
          </div>
        ))}
        {(single ? value.length === 0 && uploads.length === 0 : value.length + uploads.length < max) && (
          <button type="button" onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
            className={cn('flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary', single ? 'aspect-[16/9]' : 'aspect-square')}>
            <ImagePlus className="size-5" /> {single ? 'Upload image' : 'Add images'}
          </button>
        )}
      </div>
      {single && value.length > 0 && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}><Upload /> Replace</Button>}
      <input ref={inputRef} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} />
    </div>
  )
}

/** Small tag/chip input for amenities and similar string lists. */
export function TagInput({ value = [], onChange, suggestions = [], placeholder = 'Add and press Enter' }) {
  const [text, setText] = useState('')
  const add = (t) => { const v = t.trim(); if (v && !value.includes(v)) onChange([...value, v]); setText('') }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-md border bg-white p-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
            {t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="size-3" /></button>
          </span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text) } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)) }}
          className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none" />
      </div>
      {suggestions.filter((s) => !value.includes(s)).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !value.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export { GripVertical }
