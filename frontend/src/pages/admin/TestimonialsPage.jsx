import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquareQuote } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field } from '@/components/common/Field'
import { Stars } from '@/components/common/Primitives'
import { CrudList, FormActions } from '@/components/admin/CrudList'
import { testimonialsApi } from '@/services/content/contentService'
import { testimonialSchema } from '@/validations/schemas'

function TestimonialForm({ initial, onSave, onCancel, nextOrder }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { guestName: initial.guestName || '', location: initial.location || '', review: initial.review || '', rating: initial.rating ?? 5, displayOrder: initial.displayOrder ?? nextOrder, isPublished: initial.isPublished ?? true },
  })
  return (
    <form onSubmit={handleSubmit((v) => onSave(v).catch((e) => toast.error(e.message)))} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Guest name" error={errors.guestName} required><Input {...register('guestName')} /></Field>
      <Field label="Location / context" error={errors.location}><Input placeholder="Mumbai · Family stay" {...register('location')} /></Field>
      <Field label="Review" error={errors.review} required className="sm:col-span-2"><Textarea rows={4} {...register('review')} /></Field>
      <Field label="Rating" error={errors.rating}>
        <Controller control={control} name="rating" render={({ field }) => (
          <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} star{n > 1 && 's'}</SelectItem>)}</SelectContent>
          </Select>
        )} />
      </Field>
      <label className="flex items-center gap-3 self-end pb-2 text-sm"><Controller control={control} name="isPublished" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} /> Published</label>
      <FormActions onCancel={onCancel} submitting={isSubmitting} />
    </form>
  )
}

export default function TestimonialsPage() {
  return (
    <CrudList
      api={testimonialsApi}
      collectionName="testimonials"
      title="Testimonials"
      noun="testimonial"
      activeField="isPublished"
      emptyIcon={MessageSquareQuote}
      searchFields={['guestName', 'review']}
      FormComponent={TestimonialForm}
      renderRow={(t) => (
        <div>
          <div className="flex items-center gap-3"><p className="font-medium">{t.guestName}</p><Stars rating={t.rating} className="[&_svg]:size-3" /></div>
          <p className="line-clamp-1 text-xs text-muted-foreground">{t.review}</p>
        </div>
      )}
    />
  )
}
