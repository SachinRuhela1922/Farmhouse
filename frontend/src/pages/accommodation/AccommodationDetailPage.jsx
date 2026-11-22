import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BedDouble, Bath, Users, CalendarCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Seo } from '@/components/common/Seo'
import { Img, Reveal, StatusBadge, EmptyState } from '@/components/common/Primitives'
import { Icon, AMENITY_ICON } from '@/components/common/Icon'
import { Lightbox } from '@/components/common/Lightbox'
import { WhatsAppIcon } from '@/components/common/BrandIcons'
import { getAccommodationBySlug } from '@/services/accommodation/accommodationService'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useBookedDates } from '@/hooks/useContent'
import { formatCurrency, whatsappLink, toISODate } from '@/utils/format'
import { Calendar } from '@/components/ui/calendar'
import { startOfToday } from 'date-fns'

export default function AccommodationDetailPage() {
  const { slug } = useParams()
  const { settings } = useSiteSettings()
  const [state, setState] = useState({ item: null, loading: true })
  const [lightbox, setLightbox] = useState(null)
  const { bookedDates } = useBookedDates(state.item?.id)

  useEffect(() => {
    let live = true
    setState({ item: null, loading: true })
    getAccommodationBySlug(slug).then((item) => live && setState({ item, loading: false })).catch(() => live && setState({ item: null, loading: false }))
    return () => { live = false }
  }, [slug])

  const { item, loading } = state
  if (loading)
    return (
      <div className="container-lux pt-32 pb-20">
        <Skeleton className="h-[52vh] rounded-[28px]" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div>
      </div>
    )
  if (!item)
    return (
      <div className="container-lux pt-36 pb-24">
        <EmptyState icon={BedDouble} title="This stay isn’t available" description="It may have been renamed or is temporarily unavailable." action={<Button asChild className="rounded-full"><Link to="/accommodation">See all stays</Link></Button>} />
      </div>
    )

  const imgs = item.images || []
  const currency = settings.bookingSettings.currency
  const wa = whatsappLink(settings.contact.whatsapp, `Hello! I'm interested in booking "${item.name}". Could you share availability?`)

  return (
    <>
      <Seo title={item.name} description={item.shortDescription || item.description?.slice(0, 160)} image={imgs[0]?.url} path={`/accommodation/${slug}`} />
      <div className="container-lux pt-28 sm:pt-32">
        <Link to="/accommodation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All stays</Link>
        <Reveal className="mt-5 grid h-[52vh] min-h-[340px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[28px]">
          {imgs.slice(0, 5).map((im, i) => (
            <button key={i} onClick={() => setLightbox(i)} className={`group relative overflow-hidden ${i === 0 ? 'col-span-4 row-span-2 sm:col-span-2' : 'hidden sm:block'} ${imgs.length < 4 && i > 0 ? 'sm:row-span-2' : ''}`} aria-label={`View photo ${i + 1}`}>
              <Img src={im.url} alt={`${item.name} photo ${i + 1}`} className="img-zoom size-full" eager={i === 0} width={i === 0 ? 1600 : 800} />
              {i === Math.min(imgs.length, 5) - 1 && imgs.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium">View all {imgs.length} photos</span>}
            </button>
          ))}
          {imgs.length === 0 && <div className="col-span-4 row-span-2 bg-sand/40" />}
        </Reveal>
      </div>

      <section className="container-lux grid gap-12 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <StatusBadge status={item.isActive ? 'active' : 'inactive'} />
          <h1 className="mt-4 text-5xl sm:text-6xl">{item.name}</h1>
          <div className="mt-6 flex flex-wrap gap-6 border-y py-5 text-sm">
            <span className="flex items-center gap-2"><Users className="size-5 text-primary" /> Up to {item.capacity} guests</span>
            <span className="flex items-center gap-2"><BedDouble className="size-5 text-primary" /> {item.bedrooms} bedrooms</span>
            <span className="flex items-center gap-2"><Bath className="size-5 text-primary" /> {item.bathrooms} bathrooms</span>
          </div>
          <p className="mt-8 whitespace-pre-line text-lg leading-relaxed text-foreground/80">{item.description}</p>

          {item.amenities?.length > 0 && (
            <>
              <h2 className="mt-14 text-3xl">Facilities</h2>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {item.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-3 text-sm"><span className="grid size-9 place-items-center rounded-full bg-accent text-primary"><Icon name={AMENITY_ICON[a]} className="size-4" /></span>{a}</li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-14 text-3xl">Availability</h2>
          <p className="mt-2 text-sm text-muted-foreground">Struck-through dates are already booked.</p>
          <div className="mt-5 inline-block rounded-2xl border bg-white p-2 shadow-soft">
            <Calendar
              numberOfMonths={2}
              disabled={{ before: startOfToday() }}
              modifiers={{ booked: (d) => bookedDates.has(toISODate(d)) }}
              modifiersClassNames={{ booked: 'line-through opacity-40' }}
              startMonth={startOfToday()}
              className="[&_.rdp-months]:flex-col sm:[&_.rdp-months]:flex-row"
            />
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl bg-white p-7 shadow-lift ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">From</p>
            <p className="font-serif text-5xl">{formatCurrency(item.pricePerNight, currency)}<span className="font-sans text-base text-muted-foreground"> / night</span></p>
            {item.weekendPrice > 0 && <p className="mt-1 text-sm text-muted-foreground">Fri & Sat nights: {formatCurrency(item.weekendPrice, currency)}</p>}
            <ul className="mt-6 space-y-3 border-t pt-6 text-sm">
              <li className="flex gap-3"><Clock className="size-4 text-primary" /> Check-in {settings.bookingSettings.checkInTime} · Check-out {settings.bookingSettings.checkOutTime}</li>
              <li className="flex gap-3"><CalendarCheck className="size-4 shrink-0 text-primary" /> {settings.bookingSettings.cancellationPolicy}</li>
            </ul>
            <Button asChild size="lg" className="mt-7 h-12 w-full rounded-full"><Link to={`/booking?accommodation=${item.id}`}>Book this stay</Link></Button>
            {wa && <Button asChild size="lg" variant="outline" className="mt-3 h-12 w-full rounded-full"><a href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon className="text-[#25D366]" /> Enquire on WhatsApp</a></Button>}
            <p className="mt-4 text-center text-xs text-muted-foreground">Taxes and charges shown before you confirm.</p>
          </div>
        </aside>
      </section>
      <Lightbox items={imgs.map((im, i) => ({ id: i, imageUrl: im.url, title: item.name }))} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
    </>
  )
}
