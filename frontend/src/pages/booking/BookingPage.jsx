import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, BedDouble, CalendarX2, CheckCircle2, Lock, MailWarning, Moon, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Seo } from '@/components/common/Seo'
import { Field } from '@/components/common/Field'
import { Img, Spinner, EmptyState } from '@/components/common/Primitives'
import { WhatsAppIcon } from '@/components/common/BrandIcons'
import { DateRangePicker } from '@/components/booking/DateRangePicker'
import { Counter } from '@/components/booking/AvailabilityWidget'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { useAccommodations } from '@/hooks/useContent'
import { useBookedDates } from '@/hooks/useContent'
import { useAuth } from '@/context/AuthContext'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { bookingSchema } from '@/validations/schemas'
import { createBooking, getQuote } from '@/services/booking/bookingService'
import { errorMessage as callableErrorMessage } from '@/services/api/client'
import { resendVerification } from '@/services/auth/authService'
import { formatCurrency, formatDate, nightsBetween, whatsappLink } from '@/utils/format'

const DRAFT_KEY = 'booking-draft'

function Step({ n, title, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-border/50 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</span>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function BookingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, emailVerified, refreshUser } = useAuth()
  const { settings } = useSiteSettings()
  const bs = settings.bookingSettings
  const { data: stays, loading: staysLoading } = useAccommodations()

  // Restore a draft saved before redirecting to login (sessionStorage is only UI state, never booking data of record).
  const draft = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') } catch { return null }
  }, [])

  const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: '', email: '', phone: '',
      accommodationId: params.get('accommodation') || draft?.accommodationId || '',
      checkIn: params.get('checkIn') || draft?.checkIn || '',
      checkOut: params.get('checkOut') || draft?.checkOut || '',
      adults: Number(params.get('adults') || draft?.adults || 2),
      children: Number(params.get('children') || draft?.children || 0),
      services: draft?.services || [],
      specialRequests: draft?.specialRequests || '',
      acceptPolicy: false,
    },
  })

  // Prefill guest details from the signed-in profile
  useEffect(() => {
    const v = getValues()
    if (profile?.fullName && !v.guestName) setValue('guestName', profile.fullName)
    if (user?.email && !v.email) setValue('email', user.email)
    if (profile?.phone && !v.phone) setValue('phone', profile.phone)
  }, [profile, user, getValues, setValue])

  const [accommodationId, checkIn, checkOut, adults, children, services] = useWatch({ control, name: ['accommodationId', 'checkIn', 'checkOut', 'adults', 'children', 'services'] })
  const stay = stays?.find((s) => s.id === accommodationId)
  const { bookedDates } = useBookedDates(accommodationId)
  const nights = nightsBetween(checkIn, checkOut)
  const guests = Number(adults) + Number(children)
  const overCapacity = stay && guests > stay.capacity

  // Auto-select first stay if only one exists
  useEffect(() => {
    if (!accommodationId && stays?.length === 1) setValue('accommodationId', stays[0].id)
  }, [stays, accommodationId, setValue])

  /* ---------- Live server-side quote (debounced) ---------- */
  const [quote, setQuote] = useState({ data: null, loading: false, error: null })
  const reqId = useRef(0)
  const servicesKey = (services || []).join(',')
  useEffect(() => {
    if (!accommodationId || !checkIn || !checkOut || nights < 1 || overCapacity) { setQuote({ data: null, loading: false, error: null }); return }
    const id = ++reqId.current
    setQuote((q) => ({ ...q, loading: true, error: null }))
    const t = setTimeout(async () => {
      try {
        const data = await getQuote({ accommodationId, checkIn, checkOut, adults: Number(adults), children: Number(children), services: services || [] })
        if (id === reqId.current) setQuote({ data, loading: false, error: null })
      } catch (e) {
        if (id === reqId.current) setQuote({ data: null, loading: false, error: callableErrorMessage(e) })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accommodationId, checkIn, checkOut, adults, children, servicesKey, nights, overCapacity])

  const needsVerify = user && bs.requireVerifiedEmail && !emailVerified

  const onSubmit = async (values) => {
    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, acceptPolicy: false }))
      toast.info('Please sign in to complete your booking — your selection is saved.')
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    if (needsVerify) return toast.error('Please verify your email address before booking.')
    if (quote.data && !quote.data.available) return toast.error('Those dates are no longer available.')
    try {
      const { acceptPolicy: _a, ...payload } = values
      const res = await createBooking({ ...payload, adults: Number(values.adults), children: Number(values.children) })
      sessionStorage.removeItem(DRAFT_KEY)
      toast.success('Booking request received!')
      navigate(`/booking/confirmation/${res.bookingId}`, { replace: true })
    } catch (e) {
      toast.error(callableErrorMessage(e))
    }
  }

  const wa = whatsappLink(settings.contact.whatsapp, `Hello! I'd like to book ${stay?.name || 'a stay'}${checkIn ? ` from ${formatDate(checkIn)} to ${formatDate(checkOut)}` : ''} for ${guests} guests.`)

  return (
    <>
      <Seo title="Book your stay" description="Check availability and book your private farmhouse stay." path="/booking" />
      <div className="bg-cream/50 pt-32 pb-20 sm:pt-36">
        <div className="container-lux">
          <div className="max-w-2xl">
            <p className="eyebrow">Reservations</p>
            <h1 className="mt-3 text-5xl sm:text-6xl">Book your stay</h1>
            <p className="mt-4 text-muted-foreground">Choose your dates and stay — pricing is calculated live, including all taxes. Your request is confirmed by our team, usually within a few hours.</p>
          </div>

          {!staysLoading && !stays?.length ? (
            <EmptyState icon={BedDouble} className="mt-10" title="Bookings open soon" description="No accommodation is available for booking right now. Please contact us directly." action={<Button asChild className="rounded-full"><Link to="/contact">Contact us</Link></Button>} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
              <div className="space-y-6">
                <Step n={1} title="Your stay">
                  <div className="grid gap-5">
                    <Field label="Accommodation" error={errors.accommodationId} required>
                      <Controller
                        control={control}
                        name="accommodationId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('checkIn', ''); setValue('checkOut', '') }}>
                            <SelectTrigger className="h-12 w-full bg-white"><SelectValue placeholder={staysLoading ? 'Loading…' : 'Select a stay'} /></SelectTrigger>
                            <SelectContent>
                              {stays?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name} · up to {s.capacity} · {formatCurrency(s.pricePerNight, bs.currency)}/night</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                    <Field label="Dates" error={errors.checkIn || errors.checkOut} required hint={accommodationId ? `Minimum ${bs.minNights} night${bs.minNights > 1 ? 's' : ''}, maximum ${bs.maxNights}.` : 'Select an accommodation first to see availability.'}>
                      <DateRangePicker
                        checkIn={checkIn}
                        checkOut={checkOut}
                        bookedDates={bookedDates}
                        maxAdvanceDays={bs.maxAdvanceDays}
                        invalid={!!(errors.checkIn || errors.checkOut)}
                        onChange={({ checkIn: a, checkOut: b }) => { setValue('checkIn', a); setValue('checkOut', b, { shouldValidate: !!b }) }}
                      />
                    </Field>
                    <div className="grid gap-x-8 rounded-xl border bg-white px-5 py-2 sm:grid-cols-2">
                      <Controller control={control} name="adults" render={({ field }) => <Counter label="Adults" hint="Ages 13+" value={field.value} onChange={field.onChange} min={1} max={stay?.capacity || 30} />} />
                      <Controller control={control} name="children" render={({ field }) => <Counter label="Children" hint="Ages 2–12" value={field.value} onChange={field.onChange} max={stay ? Math.max(stay.capacity - adults, 0) : 20} />} />
                    </div>
                    {overCapacity && <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {stay.name} hosts up to {stay.capacity} guests.</p>}
                  </div>
                </Step>

                {bs.services?.length > 0 && (
                  <Step n={2} title="Additional services">
                    <Controller
                      control={control}
                      name="services"
                      render={({ field }) => (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {bs.services.map((s) => {
                            const checked = field.value?.includes(s.id)
                            return (
                              <label key={s.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? 'border-primary bg-accent/40' : 'bg-white hover:border-primary/40'}`}>
                                <Checkbox checked={checked} onCheckedChange={(c) => field.onChange(c ? [...(field.value || []), s.id] : field.value.filter((x) => x !== s.id))} className="mt-0.5" />
                                <span>
                                  <span className="block text-sm font-medium">{s.name}</span>
                                  <span className="text-xs text-muted-foreground">{formatCurrency(s.price, bs.currency)} {({ per_booking: 'per stay', per_night: 'per night', per_guest: 'per guest', per_guest_night: 'per guest / night' })[s.unit]}</span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    />
                  </Step>
                )}

                <Step n={bs.services?.length ? 3 : 2} title="Guest details">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" error={errors.guestName} required><Input autoComplete="name" className="h-11" {...register('guestName')} /></Field>
                    <Field label="Phone number" error={errors.phone} required><Input type="tel" autoComplete="tel" className="h-11" placeholder="+91 98765 43210" {...register('phone')} /></Field>
                    <Field label="Email" error={errors.email} required className="sm:col-span-2"><Input type="email" autoComplete="email" className="h-11" {...register('email')} /></Field>
                    <Field label="Special requests" error={errors.specialRequests} className="sm:col-span-2"><Textarea rows={4} placeholder="Occasion, dietary needs, arrival time…" {...register('specialRequests')} /></Field>
                    <Controller
                      control={control}
                      name="acceptPolicy"
                      render={({ field }) => (
                        <div className="sm:col-span-2">
                          <label className="flex items-start gap-3 text-sm">
                            <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" aria-invalid={!!errors.acceptPolicy} />
                            <span className="text-muted-foreground">I agree to the house rules and cancellation policy: <span className="text-foreground">{bs.cancellationPolicy}</span></span>
                          </label>
                          {errors.acceptPolicy && <p className="mt-2 text-xs text-destructive">{errors.acceptPolicy.message}</p>}
                        </div>
                      )}
                    />
                  </div>
                </Step>
              </div>

              {/* ---------- Summary ---------- */}
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-border/60">
                  {stay && (
                    <div className="flex gap-4 border-b p-5">
                      <Img src={stay.images?.[0]?.url} alt="" className="size-20 shrink-0 rounded-xl" width={200} />
                      <div className="min-w-0">
                        <p className="font-serif text-2xl leading-tight">{stay.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{stay.bedrooms} bedrooms · up to {stay.capacity} guests</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-5 p-6">
                    <h3 className="text-2xl">Booking summary</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Check-in</dt><dd className="font-medium">{checkIn ? formatDate(checkIn, 'EEE, dd MMM yyyy') : '—'}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Check-out</dt><dd className="font-medium">{checkOut ? formatDate(checkOut, 'EEE, dd MMM yyyy') : '—'}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Nights</dt><dd className="flex items-center gap-1 font-medium"><Moon className="size-3.5" />{nights || '—'}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Guests</dt><dd className="font-medium">{adults} adult{adults > 1 && 's'}{children > 0 && `, ${children} child${children > 1 ? 'ren' : ''}`}</dd></div>
                    </dl>

                    <AnimatePresence mode="wait">
                      {quote.loading ? (
                        <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5 border-t pt-5">
                          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
                        </motion.div>
                      ) : quote.error ? (
                        <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 rounded-xl bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" />{quote.error}</motion.p>
                      ) : quote.data ? (
                        <motion.div key="q" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border-t pt-5">
                          {quote.data.available ? (
                            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Available for your dates</p>
                          ) : (
                            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-destructive"><CalendarX2 className="size-4" /> Not available — {quote.data.reason || 'please choose different dates'}</p>
                          )}
                          <PriceBreakdown pricing={quote.data} />
                        </motion.div>
                      ) : (
                        <p className="border-t pt-5 text-sm text-muted-foreground">Select a stay and dates to see your price.</p>
                      )}
                    </AnimatePresence>

                    {needsVerify && (
                      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                        <p className="flex items-center gap-2 font-medium"><MailWarning className="size-4" /> Verify your email to book</p>
                        <p className="mt-1 text-xs">We sent a link to {user.email}.</p>
                        <div className="mt-3 flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => resendVerification().then((r) => (r.emailDelivery === 'sent' ? toast.success('Verification email sent') : toast.warning('Email sending is not configured on the server yet.'))).catch((e) => toast.error(e.message))}>Resend</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={async () => { await refreshUser(); toast.message('Status refreshed') }}>I’ve verified</Button>
                        </div>
                      </div>
                    )}

                    <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={isSubmitting || quote.loading || (quote.data && !quote.data.available) || overCapacity}>
                      {isSubmitting ? <Spinner className="size-4 text-current" /> : user ? <Lock className="size-4" /> : null}
                      {user ? 'Request booking' : 'Sign in to book'}
                    </Button>
                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> No payment now — pay securely once confirmed</p>
                    {wa && <a href={wa} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"><WhatsAppIcon className="size-4 text-[#25D366]" /> Prefer WhatsApp? Enquire instantly</a>}
                  </div>
                </div>
              </aside>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
