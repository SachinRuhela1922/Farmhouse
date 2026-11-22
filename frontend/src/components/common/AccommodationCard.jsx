import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BedDouble, Bath, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { formatCurrency } from '@/utils/format'
import { Img, StatusBadge } from './Primitives'
import { Icon, AMENITY_ICON } from './Icon'

export function AccommodationCard({ item, index = 0 }) {
  const { settings } = useSiteSettings()
  const href = `/accommodation/${item.slug || item.id}`
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border/60 transition-shadow duration-500 hover:shadow-lift"
    >
      <Link to={href} className="relative block aspect-[4/3] overflow-hidden">
        <Img src={item.images?.[0]?.url} alt={item.name} className="img-zoom size-full" width={900} sizes="(min-width:1024px) 33vw, 100vw" />
        <div className="absolute left-4 top-4"><StatusBadge status={item.isActive ? 'active' : 'inactive'} className="bg-white/90 backdrop-blur" /></div>
        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-foreground backdrop-blur">
          {formatCurrency(item.pricePerNight, settings.bookingSettings.currency)}<span className="font-normal text-muted-foreground"> / night</span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl"><Link to={href} className="hover:text-primary">{item.name}</Link></h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.shortDescription || item.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-foreground/75">
          <span className="flex items-center gap-1.5"><Users className="size-4 text-primary/70" />{item.capacity} guests</span>
          <span className="flex items-center gap-1.5"><BedDouble className="size-4 text-primary/70" />{item.bedrooms} bed</span>
          <span className="flex items-center gap-1.5"><Bath className="size-4 text-primary/70" />{item.bathrooms} bath</span>
        </div>
        {item.amenities?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.amenities.slice(0, 4).map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11.5px] text-secondary-foreground">
                <Icon name={AMENITY_ICON[a]} className="size-3" />{a}
              </span>
            ))}
            {item.amenities.length > 4 && <span className="rounded-full px-2 py-1 text-[11.5px] text-muted-foreground">+{item.amenities.length - 4} more</span>}
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-6">
          <Button asChild variant="outline" className="flex-1 rounded-full"><Link to={href}>Details</Link></Button>
          <Button asChild className="flex-1 rounded-full"><Link to={`/booking?accommodation=${item.id}`}>Book now</Link></Button>
        </div>
      </div>
    </motion.article>
  )
}

export function AccommodationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2 pt-4"><Skeleton className="h-9 flex-1 rounded-full" /><Skeleton className="h-9 flex-1 rounded-full" /></div>
      </div>
    </div>
  )
}
