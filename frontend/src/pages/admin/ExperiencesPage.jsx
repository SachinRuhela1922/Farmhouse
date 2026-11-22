import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field } from '@/components/common/Field'
import { Img } from '@/components/common/Primitives'
import { Icon, ICONS } from '@/components/common/Icon'
import { CrudList, FormActions } from '@/components/admin/CrudList'
import { ImageListInput } from '@/components/admin/AdminUi'
import { experiencesApi } from '@/services/content/contentService'
import { experienceSchema } from '@/validations/schemas'
import { formatCurrency } from '@/utils/format'

export function IconSelect({ value, onChange }) {
  return (
    <Select value={value || 'Leaf'} onValueChange={onChange}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-72">
        {Object.keys(ICONS).map((k) => <SelectItem key={k} value={k}><Icon name={k} /> {k}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function ExperienceForm({ initial, onSave, onCancel, nextOrder }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: initial.title || '', description: initial.description || '', category: initial.category || '', icon: initial.icon || 'Leaf',
      price: initial.price ?? 0, displayOrder: initial.displayOrder ?? nextOrder, isActive: initial.isActive ?? true,
    },
  })
  const img = useForm({ defaultValues: { image: initial.image ? [{ url: initial.image, mediaId: initial.mediaId }] : [] } })
  const submit = async (values) => {
    const [first] = img.getValues('image')
    if (!first) return toast.error('Please add an image.')
    try { await onSave({ ...values, image: first.url, ...(first.mediaId && { mediaId: first.mediaId }) }) } catch (e) { toast.error(e.message) }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Title" error={errors.title} required><Input {...register('title')} /></Field>
      <Field label="Category" error={errors.category} hint="e.g. Leisure, Dining, Celebrations"><Input {...register('category')} /></Field>
      <Field label="Description" error={errors.description} required className="sm:col-span-2"><Textarea rows={3} {...register('description')} /></Field>
      <Field label="Starting price" error={errors.price} hint="0 = included with your stay"><Input type="number" min="0" {...register('price')} /></Field>
      <div className="grid gap-2"><Label>Icon</Label><Controller control={control} name="icon" render={({ field }) => <IconSelect value={field.value} onChange={field.onChange} />} /></div>
      <div className="grid gap-2 sm:col-span-2"><Label>Image</Label><Controller control={img.control} name="image" render={({ field }) => <ImageListInput single value={field.value} onChange={field.onChange} folder="experiences" />} /></div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2"><Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} /> Published</label>
      <FormActions onCancel={onCancel} submitting={isSubmitting} />
    </form>
  )
}

export default function ExperiencesPage() {
  return (
    <CrudList
      api={experiencesApi}
      collectionName="experiences"
      title="Experiences"
      noun="experience"
      emptyIcon={Sparkles}
      searchFields={['title', 'category']}
      FormComponent={ExperienceForm}
      renderRow={(e) => (
        <div className="flex items-center gap-4">
          <Img src={e.image} alt="" className="hidden size-14 shrink-0 rounded-lg sm:block" width={160} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium"><Icon name={e.icon} className="size-4 text-primary" />{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.category || 'Uncategorised'} · {e.price > 0 ? `From ${formatCurrency(e.price)}` : 'Included'}</p>
          </div>
        </div>
      )}
    />
  )
}
