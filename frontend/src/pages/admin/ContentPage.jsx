import { Controller } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Panel, ImageListInput } from '@/components/admin/AdminUi'
import { useSettingsForm, SaveBar, TextField, SingleImageField, ListField } from '@/components/admin/SettingsForm'
import { IconSelect } from './ExperiencesPage'

const iconCol = { key: 'icon', render: (name, form) => <Controller control={form.control} name={name} render={({ field }) => <IconSelect value={field.value} onChange={field.onChange} />} /> }

function HomeTab() {
  const form = useSettingsForm((s) => ({ announcement: s.announcement, hero: s.hero, highlights: s.highlights, whyChooseUs: s.whyChooseUs, videoShowcase: s.videoShowcase, pricingHighlights: s.pricingHighlights.map((p) => ({ ...p, featuresText: (p.features || []).join('\n') })) }))
  const transform = (v) => ({
    ...v,
    pricingHighlights: v.pricingHighlights.map(({ featuresText, ...p }) => ({ ...p, features: (featuresText || '').split('\n').map((x) => x.trim()).filter(Boolean) })),
  })
  return (
    <div className="space-y-6">
      <Panel title="Announcement bar">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr_200px] sm:items-end">
          <label className="flex items-center gap-2 pb-2 text-sm"><Controller control={form.control} name="announcement.enabled" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /> Show</label>
          <TextField form={form} name="announcement.text" label="Text" />
          <TextField form={form} name="announcement.link" label="Link (optional)" placeholder="/booking" />
        </div>
      </Panel>
      <Panel title="Hero section">
        <div className="grid gap-4">
          <TextField form={form} name="hero.eyebrow" label="Eyebrow line" />
          <TextField form={form} name="hero.heading" label="Heading" textarea rows={2} />
          <TextField form={form} name="hero.subtitle" label="Subtitle" textarea rows={2} />
          <div className="grid gap-2">
            <Label className="text-[13px]">Hero images (rotate as a slideshow)</Label>
            <Controller control={form.control} name="hero.images" render={({ field }) => <ImageListInput value={field.value} onChange={(v) => field.onChange(v, { shouldDirty: true })} folder="hero" max={6} />} />
          </div>
          <TextField form={form} name="hero.videoUrl" label="Background video URL (optional, .mp4 — replaces images)" placeholder="https://…/hero.mp4" />
        </div>
      </Panel>
      <Panel title="Property highlights"><ListField form={form} name="highlights" fields={[iconCol, { key: 'title', placeholder: 'Title' }, { key: 'text', placeholder: 'Short description', wide: true }]} empty={{ icon: 'Leaf', title: '', text: '' }} /></Panel>
      <Panel title="Why choose us"><ListField form={form} name="whyChooseUs" fields={[iconCol, { key: 'title', placeholder: 'Title' }, { key: 'text', placeholder: 'Short description', wide: true }]} empty={{ icon: 'Sparkles', title: '', text: '' }} /></Panel>
      <Panel title="Pricing highlights" description="Marketing cards only — actual booking prices come from each accommodation & tax settings.">
        <ListField form={form} name="pricingHighlights" max={3} fields={[
          { key: 'title', placeholder: 'Title' }, { key: 'price', placeholder: 'Price label (e.g. From ₹14,500)' }, { key: 'note', placeholder: 'Note (e.g. per night)' },
          { key: 'featuresText', wide: true, render: (n, f) => <textarea {...f.register(n)} rows={3} placeholder="One feature per line" className="w-full rounded-md border bg-white px-3 py-2 text-sm" /> },
          { key: 'featured', render: (n, f) => <label className="flex items-center gap-2 text-sm"><Controller control={f.control} name={n} render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /> Highlight</label> },
        ]} empty={{ title: '', price: '', note: '', featuresText: '', featured: false }} />
      </Panel>
      <Panel title="Video showcase">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="videoShowcase.title" label="Title" />
          <TextField form={form} name="videoShowcase.subtitle" label="Subtitle" />
          <TextField form={form} name="videoShowcase.videoUrl" label="Video URL (YouTube, Vimeo or .mp4)" className="sm:col-span-2" placeholder="https://www.youtube.com/watch?v=…" />
          <div className="sm:col-span-2"><SingleImageField form={form} name="videoShowcase.posterUrl" label="Poster image" folder="content" /></div>
        </div>
      </Panel>
      <SaveBar form={form} transform={transform} />
    </div>
  )
}

function AboutTab() {
  const form = useSettingsForm((s) => ({ about: s.about, team: s.team }))
  return (
    <div className="space-y-6">
      <Panel title="About section">
        <div className="grid gap-4">
          <TextField form={form} name="about.heading" label="Heading" />
          <TextField form={form} name="about.body" label="Intro (home page)" textarea />
          <TextField form={form} name="about.story" label="Our story" textarea rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField form={form} name="about.mission" label="Mission" textarea />
            <TextField form={form} name="about.vision" label="Vision" textarea />
            <TextField form={form} name="about.surroundings" label="Nature & surroundings" textarea />
            <TextField form={form} name="about.hospitality" label="Hospitality" textarea />
          </div>
          <SingleImageField form={form} name="about.image" label="About image" folder="content" />
          <ListField form={form} name="about.stats" label="Stats" max={4} fields={[{ key: 'value', placeholder: 'Value (e.g. 12)' }, { key: 'label', placeholder: 'Label (e.g. Acres)' }]} empty={{ value: '', label: '' }} />
        </div>
      </Panel>
      <Panel title="Team">
        <ListField form={form} name="team" fields={[{ key: 'name', placeholder: 'Name' }, { key: 'role', placeholder: 'Role' }, { key: 'image', render: (n, f) => <SingleImageField form={f} name={n} label="Photo (optional)" folder="team" />, wide: true }]} empty={{ name: '', role: '', image: '' }} addLabel="Add team member" />
      </Panel>
      <SaveBar form={form} />
    </div>
  )
}

function ContactTab() {
  const form = useSettingsForm((s) => ({ contact: s.contact, socialLinks: s.socialLinks, instagram: s.instagram, footer: s.footer }))
  return (
    <div className="space-y-6">
      <Panel title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="contact.phone" label="Phone" />
          <TextField form={form} name="contact.email" label="Email" type="email" />
          <TextField form={form} name="contact.whatsapp" label="WhatsApp number (with country code, digits only)" placeholder="919876543210" />
          <TextField form={form} name="contact.mapQuery" label="Google Maps search / place name" />
          <TextField form={form} name="contact.address" label="Address" textarea className="sm:col-span-2" />
          <div className="sm:col-span-2"><ListField form={form} name="contact.businessHours" label="Business hours" fields={[{ key: 'day', placeholder: 'Days' }, { key: 'hours', placeholder: 'Hours' }]} empty={{ day: '', hours: '' }} /></div>
        </div>
      </Panel>
      <Panel title="Social links">
        <div className="grid gap-4 sm:grid-cols-2">
          {['instagram', 'facebook', 'youtube', 'twitter'].map((k) => <TextField key={k} form={form} name={`socialLinks.${k}`} label={k[0].toUpperCase() + k.slice(1)} placeholder="https://…" />)}
        </div>
      </Panel>
      <Panel title="Instagram section">
        <div className="grid gap-4">
          <TextField form={form} name="instagram.handle" label="Handle" />
          <div className="grid gap-2">
            <Label className="text-[13px]">Images (6 recommended)</Label>
            <Controller control={form.control} name="instagram.images" render={({ field }) => (
              <ImageListInput folder="instagram" max={6} value={(field.value || []).map((url) => ({ url }))} onChange={(list) => field.onChange(list.map((x) => x.url), { shouldDirty: true })} />
            )} />
          </div>
        </div>
      </Panel>
      <Panel title="Footer">
        <div className="grid gap-4"><TextField form={form} name="footer.text" label="Footer text" textarea /><TextField form={form} name="footer.copyright" label="Copyright line" /></div>
      </Panel>
      <SaveBar form={form} />
    </div>
  )
}

export default function ContentPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Edit website copy and imagery. FAQs, testimonials and experiences have their own sections.</p>
        <Button asChild variant="outline" size="sm"><Link to="/" target="_blank"><ExternalLink /> Preview website</Link></Button>
      </div>
      <Tabs defaultValue="home">
        <TabsList className="mb-6">
          <TabsTrigger value="home">Home page</TabsTrigger>
          <TabsTrigger value="about">About & team</TabsTrigger>
          <TabsTrigger value="contact">Contact & footer</TabsTrigger>
        </TabsList>
        <TabsContent value="home"><HomeTab /></TabsContent>
        <TabsContent value="about"><AboutTab /></TabsContent>
        <TabsContent value="contact"><ContactTab /></TabsContent>
      </Tabs>
    </div>
  )
}
