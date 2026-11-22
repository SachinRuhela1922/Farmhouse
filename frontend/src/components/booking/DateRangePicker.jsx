import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { addDays, startOfToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate, fromISODate, toISODate } from '@/utils/format'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/**
 * Check-in / check-out range picker. Values are 'YYYY-MM-DD' strings.
 * `bookedDates` (Set of ISO strings) are disabled as check-in nights.
 */
export function DateRangePicker({ checkIn, checkOut, onChange, bookedDates, maxAdvanceDays = 365, className, invalid, light }) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const today = startOfToday()
  const selected = { from: fromISODate(checkIn) || undefined, to: fromISODate(checkOut) || undefined }

  const disabled = [
    { before: today },
    { after: addDays(today, maxAdvanceDays) },
    (d) => bookedDates?.has(toISODate(d)) && !(selected.from && !selected.to && d > selected.from && isCheckoutAllowed(d)),
  ]
  // A booked night can still be chosen as the check-out day if every night before it is free.
  function isCheckoutAllowed(d) {
    if (!selected.from) return false
    for (let x = new Date(selected.from); x < d; x = addDays(x, 1)) if (bookedDates?.has(toISODate(x))) return false
    return true
  }

  const handleSelect = (range) => {
    const from = range?.from ? toISODate(range.from) : ''
    let to = range?.to ? toISODate(range.to) : ''
    if (from && to && from === to) to = ''
    // reject ranges that span a booked night
    if (from && to && bookedDates) {
      for (let x = fromISODate(from); toISODate(x) < to; x = addDays(x, 1)) {
        if (bookedDates.has(toISODate(x))) { onChange({ checkIn: toISODate(range.to), checkOut: '' }); return }
      }
    }
    onChange({ checkIn: from, checkOut: to })
    if (from && to) setTimeout(() => setOpen(false), 150)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={invalid || undefined}
          className={cn(
            'grid w-full grid-cols-2 overflow-hidden rounded-xl border text-left transition focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive',
            light ? 'border-white/30 bg-white/10 text-white' : 'border-input bg-white hover:border-ring/60',
            className,
          )}
        >
          {[['Check-in', checkIn], ['Check-out', checkOut]].map(([label, v], i) => (
            <span key={label} className={cn('flex items-center gap-3 px-4 py-3', i === 1 && (light ? 'border-l border-white/20' : 'border-l'))}>
              <CalendarDays className={cn('size-4 shrink-0', light ? 'text-white/70' : 'text-primary/70')} />
              <span className="min-w-0">
                <span className={cn('block text-[10px] font-semibold uppercase tracking-[0.18em]', light ? 'text-white/70' : 'text-muted-foreground')}>{label}</span>
                <span className={cn('block truncate text-sm font-medium', !v && (light ? 'text-white/60' : 'text-muted-foreground'))}>{v ? formatDate(v, 'EEE, dd MMM') : 'Add date'}</span>
              </span>
            </span>
          ))}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={isDesktop ? 2 : 1}
          selected={selected}
          onSelect={handleSelect}
          disabled={disabled}
          defaultMonth={selected.from || today}
          startMonth={today}
          endMonth={addDays(today, maxAdvanceDays)}
          modifiers={{ booked: (d) => bookedDates?.has(toISODate(d)) ?? false }}
          modifiersClassNames={{ booked: 'line-through opacity-50' }}
        />
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>{bookedDates?.size ? 'Struck-through dates are booked' : 'Select check-in, then check-out'}</span>
          {(checkIn || checkOut) && <button type="button" className="font-medium text-primary" onClick={() => onChange({ checkIn: '', checkOut: '' })}>Clear</button>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
