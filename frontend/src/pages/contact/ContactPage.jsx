import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/common/Seo'
import { PageHero, Reveal } from '@/components/common/Primitives'
import { MapEmbed } from '@/components/common/Sections'
import { SOCIAL, WhatsAppIcon } from '@/components/common/BrandIcons'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { telLink, whatsappLink } from '@/utils/format'
import { ContactForm } from './ContactForm'

export default function ContactPage() {
  const { settings } = useSiteSettings()
  const c = settings.contact
  const wa = whatsappLink(c.whatsapp, `Hello ${settings.businessName}, I have a question about a stay.`)
  const cards = [
    { icon: Phone, label: 'Call us', value: c.phone, href: telLink(c.phone) },
    { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}` },
    { icon: MapPin, label: 'Address', value: c.address },
  ]
  return (
    <>
      <Seo title="Contact" description={`Get in touch with ${settings.businessName} — phone, email, WhatsApp and directions.`} path="/contact" />
      <PageHero eyebrow="Contact" title="We’d love to host you" subtitle="Questions, special requests or event plans — we usually reply within a few hours." image={settings.about.image} />
      <section className="section pt-14">
        <div className="container-lux grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {cards.map((card, i) => (
              <Reveal key={card.label} delay={i * 0.06} className="flex gap-4 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><card.icon className="size-5" /></span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                  {card.href ? <a href={card.href} className="mt-1 block break-words font-medium hover:text-primary">{card.value}</a> : <p className="mt-1 font-medium leading-relaxed">{card.value}</p>}
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.2} className="flex gap-4 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><Clock className="size-5" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Business hours</p>
                {c.businessHours?.map((h) => <p key={h.day} className="mt-1 text-sm"><span className="text-muted-foreground">{h.day}</span> · {h.hours}</p>)}
              </div>
            </Reveal>
            <Reveal delay={0.25} className="flex flex-wrap items-center gap-3 pt-2">
              {wa && <Button asChild size="lg" className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5b]"><a href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon /> Chat on WhatsApp</a></Button>}
              {SOCIAL.filter((s) => settings.socialLinks?.[s.key]).map(({ key, label, Icon }) => (
                <a key={key} href={settings.socialLinks[key]} target="_blank" rel="noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full bg-white ring-1 ring-border transition hover:-translate-y-0.5 hover:text-primary"><Icon /></a>
              ))}
            </Reveal>
          </div>
          <Reveal delay={0.1} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-10">
            <h2 className="mb-2 text-4xl">Send us a message</h2>
            <p className="mb-8 text-sm text-muted-foreground">All fields marked are required. We never share your details.</p>
            <ContactForm />
          </Reveal>
        </div>
        <div className="container-lux mt-12"><MapEmbed className="h-[420px]" /></div>
      </section>
    </>
  )
}
