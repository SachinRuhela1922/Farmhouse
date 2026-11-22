import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BedDouble } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Field } from '@/components/common/Field'
import { Img } from '@/components/common/Primitives'
import { CrudList, FormActions } from '@/components/admin/CrudList'
import { ImageListInput, TagInput } from '@/components/admin/AdminUi'
import { accommodationsApi } from '@/services/accommodation/accommodationService'
import { accommodationSchema } from '@/validations/schemas'
import { AMENITY_OPTIONS } from '@/utils/constants'
import { formatCurrency } from '@/utils/format'
import { useSiteSettings } from '@/context/SiteSettingsContext'

function AccommodationForm({ initial, onSave, onCancel, nextOrder }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      name: initial.name || '', shortDescription: initial.shortDescription || '', description: initial.description || '',
      pricePerNight: initial.pricePerNight ?? '', weekendPrice: initial.weekendPrice ?? '', capacity: initial.capacity ?? 2,
      bedrooms: initial.bedrooms ?? 1, bathrooms: initial.bathrooms ?? 1, amenities: initial.amenities || [],
      displayOrder: initial.displayOrder ?? nextOrder, isActive: initial.isActive ?? true,
    },
  })
  const imagesForm = useForm({ defaultValues: { images: initial.images || [] } })

  const submit = async (values) => {
    const images = imagesForm.getValues('images')
    if (!images.length) return toast.error('Please add at least one image.')
    try {
      await onSave({ ...values, weekendPrice: Number(values.weekendPrice) || 0, images: images.map(({ url, mediaId }) => ({ url, ...(mediaId && { mediaId }) })) })
    } catch (e) { toast.error(e.message) }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Name" error={errors.name} required className="sm:col-span-2"><Input {...register('name')} /></Field>
      <Field label="Short description" error={errors.shortDescription} hint="Shown on cards (max 200 characters)" className="sm:col-span-2"><Input {...register('shortDescription')} /></Field>
      <Field label="Full description" error={errors.description} required className="sm:col-span-2"><Textarea rows={5} {...register('description')} /></Field>
      <Field label="Price per night" error={errors.pricePerNight} required><Input type="number" min="1" {...register('pricePerNight')} /></Field>
      <Field label="Weekend price (Fri & Sat nights)" error={errors.weekendPrice} hint="Leave blank to use the regular price"><Input type="number" min="0" {...register('weekendPrice')} /></Field>
      <div className="grid grid-cols-3 gap-3 sm:col-span-2">
        <Field label="Max guests" error={errors.capacity} required><Input type="number" min="1" {...register('capacity')} /></Field>
        <Field label="Bedrooms" error={errors.bedrooms}><Input type="number" min="0" {...register('bedrooms')} /></Field>
        <Field label="Bathrooms" error={errors.bathrooms}><Input type="number" min="0" {...register('bathrooms')} /></Field>
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label>Amenities</Label>
        <Controller control={control} name="amenities" render={({ field }) => <TagInput value={field.value} onChange={field.onChange} suggestions={AMENITY_OPTIONS} />} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label>Images <span className="font-normal text-muted-foreground">(first image is the cover)</span></Label>
        <Controller control={imagesForm.control} name="images" render={({ field }) => <ImageListInput value={field.value} onChange={field.onChange} folder="accommodations" />} />
      </div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
        Available for booking
      </label>
      <FormActions onCancel={onCancel} submitting={isSubmitting} />
    </form>
  )
}

export default function AccommodationsPage() {
  const { settings } = useSiteSettings()
  return (
    <CrudList
      api={accommodationsApi}
      collectionName="accommodations"
      title="Accommodations"
      noun="accommodation"
      emptyIcon={BedDouble}
      searchFields={['name', 'description']}
      FormComponent={AccommodationForm}
      dialogClassName="sm:max-w-3xl"
      renderRow={(a) => (
        <div className="flex items-center gap-4">
          <Img src={a.images?.[0]?.url} alt="" className="hidden size-14 shrink-0 rounded-lg sm:block" width={160} />
          <div className="min-w-0">
            <p className="truncate font-medium">{a.name} {!a.isActive && <span className="ml-1 text-xs font-normal text-muted-foreground">(unavailable)</span>}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(a.pricePerNight, settings.bookingSettings.currency)}/night · {a.capacity} guests · {a.bedrooms} bed · {a.bathrooms} bath · {a.images?.length || 0} photos</p>
          </div>
        </div>
      )}
    />
  )
}
