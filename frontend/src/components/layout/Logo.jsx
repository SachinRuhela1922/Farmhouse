import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSiteSettings } from '@/context/SiteSettingsContext'

export function Logo({ light = false, className, to = '/' }) {
  const { settings } = useSiteSettings()
  const [first, ...rest] = settings.businessName.split(' ')
  return (
    <Link to={to} className={cn('group flex items-center gap-2.5', className)} aria-label={`${settings.businessName} home`}>
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt="" className="h-9 w-auto object-contain" />
      ) : (
        <svg viewBox="0 0 40 40" className={cn('size-9 transition-transform duration-500 group-hover:rotate-[-6deg]', light ? 'text-white' : 'text-primary')} aria-hidden>
          <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
          <path d="M10 22 20 13l10 9v8H10z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M17 30v-6h6v6" fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )}
      <span className="leading-none">
        <span className={cn('block font-serif text-[1.35rem] font-semibold tracking-tight', light ? 'text-white' : 'text-foreground')}>{first}</span>
        {rest.length > 0 && (
          <span className={cn('block text-[9px] font-semibold uppercase tracking-[0.34em]', light ? 'text-white/75' : 'text-muted-foreground')}>{rest.join(' ')}</span>
        )}
      </span>
    </Link>
  )
}
