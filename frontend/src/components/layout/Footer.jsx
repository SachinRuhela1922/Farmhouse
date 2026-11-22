import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { SOCIAL } from '@/components/common/BrandIcons'
import { NewsletterForm } from '@/components/common/NewsletterForm'
import { telLink } from '@/utils/format'
import { Logo } from './Logo'

export function Footer() {
  const { settings } = useSiteSettings()
  const { contact, socialLinks, footer } = settings
  return (
    <footer className="relative mt-auto overflow-hidden bg-[oklch(0.25_0.03_150)] text-white/80">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-white/[0.03]" />
      <div className="container-lux relative">
        <div className="grid gap-10 border-b border-white/10 py-16 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-[oklch(0.82_0.08_80)]">Stay in the loop</p>
            <h3 className="mt-3 max-w-md text-4xl text-white">Seasonal offers & farm stories, once a month.</h3>
          </div>
          <NewsletterForm dark />
        </div>

        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">{footer.text}</p>
            <div className="mt-6 flex gap-2">
              {SOCIAL.filter((s) => socialLinks?.[s.key]).map(({ key, label, Icon }) => (
                <a key={key} href={socialLinks[key]} target="_blank" rel="noreferrer" aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:-translate-y-0.5 hover:border-white/40 hover:text-white">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-white">Explore</h4>
            <ul className="space-y-3 text-sm">
              {[['/about', 'Our story'], ['/accommodation', 'Accommodation'], ['/experiences', 'Experiences'], ['/gallery', 'Gallery'], ['/booking', 'Book a stay']].map(([to, l]) => (
                <li key={to}><Link to={to} className="transition hover:text-white">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-white">Guests</h4>
            <ul className="space-y-3 text-sm">
              {[['/account/bookings', 'My bookings'], ['/login', 'Sign in'], ['/signup', 'Create account'], ['/contact', 'Contact us'], ['/#faq', 'FAQs']].map(([to, l]) => (
                <li key={to}><Link to={to} className="transition hover:text-white">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-white">Visit</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[oklch(0.82_0.08_80)]" /><span className="leading-relaxed">{contact.address}</span></li>
              <li><a href={telLink(contact.phone)} className="flex gap-3 hover:text-white"><Phone className="size-4 shrink-0 text-[oklch(0.82_0.08_80)]" />{contact.phone}</a></li>
              <li><a href={`mailto:${contact.email}`} className="flex gap-3 break-all hover:text-white"><Mail className="size-4 shrink-0 text-[oklch(0.82_0.08_80)]" />{contact.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 py-7 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
          <p className="flex gap-5"><Link to="/contact" className="hover:text-white">Contact</Link><a href="/sitemap.xml" className="hover:text-white">Sitemap</a></p>
        </div>
      </div>
    </footer>
  )
}
