import { motion } from 'framer-motion'
import { Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format'

/** Animated status timeline built from booking.statusHistory (written by Cloud Functions). */
export function BookingTimeline({ booking }) {
  const history = booking.statusHistory?.length ? booking.statusHistory : [{ status: 'pending', at: booking.createdAt }]
  const final = booking.bookingStatus
  const happy = ['pending', 'confirmed', 'completed']
  const steps = ['rejected', 'cancelled'].includes(final) ? [...history.map((h) => h.status)] : happy
  const doneIdx = steps.lastIndexOf(final)

  return (
    <ol className="relative space-y-6">
      {steps.map((s, i) => {
        const h = [...history].reverse().find((x) => x.status === s)
        const done = i <= doneIdx
        const bad = ['rejected', 'cancelled'].includes(s)
        const current = i === doneIdx && s === 'pending'
        return (
          <motion.li key={s + i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative flex gap-4">
            {i < steps.length - 1 && <span className={cn('absolute left-[15px] top-8 h-[calc(100%-8px)] w-px', done && i < doneIdx ? 'bg-primary' : 'bg-border')} />}
            <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white', bad ? 'bg-rose-100 text-rose-700' : done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {current && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
              {bad ? <X className="size-4" /> : done && !current ? <Check className="size-4" /> : <Clock className="size-4" />}
            </span>
            <div className="pt-1">
              <p className="text-sm font-semibold capitalize">{s === 'pending' ? 'Request received' : s}</p>
              <p className="text-xs text-muted-foreground">{h?.at ? formatDate(h.at, 'dd MMM yyyy, HH:mm') : done ? '' : 'Awaiting'}</p>
              {h?.note && <p className="mt-1 text-xs text-muted-foreground">“{h.note}”</p>}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
