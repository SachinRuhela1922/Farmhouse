import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRangePicker } from './DateRangePicker'

export function Counter({ label, hint, value, onChange, min = 0, max = 20 }) {
  return (
    <div className="flex items-center justify-between gap-6 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon-sm" className="rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Decrease ${label}`}><Minus /></Button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
        <Button type="button" variant="outline" size="icon-sm" className="rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`Increase ${label}`}><Plus /></Button>
      </div>
    </div>
  )
}

/** Hero "Check availability" bar → hands the search to the booking page. */
export function AvailabilityWidget({ className }) {
  const navigate = useNavigate()
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  const submit = (e) => {
    e.preventDefault()
    if (!dates.checkIn || !dates.checkOut) return toast.error('Please choose your check-in and check-out dates.')
    const p = new URLSearchParams({ checkIn: dates.checkIn, checkOut: dates.checkOut, adults, children })
    navigate(`/booking?${p}`)
  }

  return (
    <form onSubmit={submit} className={cn('glass grid gap-2 rounded-2xl p-2 shadow-lift md:grid-cols-[1.6fr_1fr_auto]', className)}>
      <DateRangePicker checkIn={dates.checkIn} checkOut={dates.checkOut} onChange={setDates} className="border-transparent bg-white/80" />
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 text-left transition hover:bg-white">
            <Users className="size-4 text-primary/70" />
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Guests</span>
              <span className="block text-sm font-medium">{adults} adult{adults > 1 && 's'}{children ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}</span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <Counter label="Adults" hint="Ages 13+" value={adults} onChange={setAdults} min={1} max={30} />
          <Counter label="Children" hint="Ages 2–12" value={children} onChange={setChildren} max={20} />
        </PopoverContent>
      </Popover>
      <Button type="submit" size="lg" className="h-auto min-h-12 rounded-xl px-7 text-sm transition hover:-translate-y-0.5">
        <Search /> Check availability
      </Button>
    </form>
  )
}
