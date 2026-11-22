import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Field } from '@/components/common/Field'
import { CrudList, FormActions } from '@/components/admin/CrudList'
import { faqsApi } from '@/services/content/contentService'
import { faqSchema } from '@/validations/schemas'

function FaqForm({ initial, onSave, onCancel, nextOrder }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: initial.question || '', answer: initial.answer || '', displayOrder: initial.displayOrder ?? nextOrder, isActive: initial.isActive ?? true },
  })
  return (
    <form onSubmit={handleSubmit((v) => onSave(v).catch((e) => toast.error(e.message)))} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Question" error={errors.question} required className="sm:col-span-2"><Input {...register('question')} /></Field>
      <Field label="Answer" error={errors.answer} required className="sm:col-span-2"><Textarea rows={5} {...register('answer')} /></Field>
      <label className="flex items-center gap-3 text-sm sm:col-span-2"><Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} /> Published</label>
      <FormActions onCancel={onCancel} submitting={isSubmitting} />
    </form>
  )
}

export default function FaqsPage() {
  return (
    <CrudList
      api={faqsApi}
      collectionName="faqs"
      title="FAQs"
      noun="FAQ"
      emptyIcon={HelpCircle}
      searchFields={['question', 'answer']}
      FormComponent={FaqForm}
      renderRow={(f) => (
        <div>
          <p className="font-medium">{f.question}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{f.answer}</p>
        </div>
      )}
    />
  )
}
