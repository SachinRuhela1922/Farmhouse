import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/common/Primitives'
import { useSiteSettings, SETTINGS_KEY } from '@/context/SiteSettingsContext'
import { useInvalidate } from '@/hooks/useApi'
import { saveSettings } from '@/services/content/contentService'
import { ImageListInput } from './AdminUi'
import { cn } from '@/lib/utils'

/**
 * Wraps a react-hook-form instance seeded from site settings. `pick(settings)` selects the slice
 * this form edits; `transform(values)` maps form values back to the Firestore shape.
 */
export function useSettingsForm(pick) {
  const { settings, loading } = useSiteSettings()
  const form = useForm({ defaultValues: pick(settings) })
  useEffect(() => { if (!loading && !form.formState.isDirty) form.reset(pick(settings)) }, [loading, settings]) // eslint-disable-line react-hooks/exhaustive-deps
  return form
}

export function SaveBar({ form, transform = (v) => v, label = 'Save changes' }) {
  const { formState: { isDirty, isSubmitting } } = form
  const invalidate = useInvalidate()
  const onSave = form.handleSubmit(async (values) => {
    try {
      await saveSettings(transform(values))
      form.reset(values)
      await invalidate(SETTINGS_KEY)
      toast.success('Saved — changes are live on the website')
    } catch (e) {
      toast.error(e.message)
    }
  })
  return (
    <div className={cn('sticky bottom-4 z-10 mt-6 flex items-center justify-end gap-3 rounded-2xl bg-white/90 p-3 shadow-lift ring-1 ring-border backdrop-blur transition', !isDirty && 'opacity-80')}>
      {isDirty && <span className="mr-auto pl-2 text-sm text-amber-700">Unsaved changes</span>}
      <Button type="button" variant="ghost" disabled={!isDirty} onClick={() => form.reset()}>Discard</Button>
      <Button type="button" onClick={onSave} disabled={!isDirty || isSubmitting}>{isSubmitting ? <Spinner className="size-4 text-current" /> : <Save />} {label}</Button>
    </div>
  )
}

export function TextField({ form, name, label, textarea, rows = 3, className, ...props }) {
  const C = textarea ? Textarea : Input
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={name} className="text-[13px]">{label}</Label>
      <C id={name} rows={textarea ? rows : undefined} {...form.register(name)} {...props} />
    </div>
  )
}

/** Image field storing a single URL string (with optional path field). */
export function SingleImageField({ form, name, label, folder }) {
  return (
    <div className="grid gap-2">
      <Label className="text-[13px]">{label}</Label>
      <Controller control={form.control} name={name} render={({ field }) => (
        <ImageListInput single folder={folder} value={field.value ? [{ url: field.value }] : []} onChange={(list) => field.onChange(list[0]?.url || '', { shouldDirty: true })} />
      )} />
    </div>
  )
}

/** Repeating group editor (e.g. highlights, stats, business hours). */
export function ListField({ form, name, label, fields: cols, empty, addLabel = 'Add item', max = 12 }) {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name })
  return (
    <div className="grid gap-3">
      {label && <Label className="text-[13px]">{label}</Label>}
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3">
          <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols.length > 2 ? 140 : 180}px, 1fr))` }}>
            {cols.map((c) => c.render
              ? <div key={c.key} className={c.wide ? 'col-span-full' : ''}>{c.render(`${name}.${i}.${c.key}`, form)}</div>
              : <Input key={c.key} placeholder={c.placeholder} aria-label={c.placeholder} className={cn('h-9 bg-white', c.wide && 'col-span-full')} {...form.register(`${name}.${i}.${c.key}`)} />)}
          </div>
          <div className="flex flex-col gap-1">
            <Button type="button" variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">↑</Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(i)} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
          </div>
        </div>
      ))}
      {fields.length < max && <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => append(empty)}><Plus /> {addLabel}</Button>}
    </div>
  )
}
