import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

const UNIT_LABEL = { per_booking: 'per stay', per_night: 'per night', per_guest: 'per guest', per_guest_night: 'per guest / night' }

/** Renders a server-computed pricing object (from getQuote or a stored booking). */
export function PriceBreakdown({ pricing, className }) {
  if (!pricing) return null
  const c = pricing.currency || 'INR'
  const Row = ({ label, value, muted, strong }) => (
    <div className={cn('flex justify-between gap-4', muted && 'text-muted-foreground', strong && 'text-base font-semibold text-foreground')}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
  return (
    <div className={cn('space-y-2.5 text-sm', className)}>
      <Row label={`${formatCurrency(pricing.baseAmount / Math.max(pricing.nights, 1), c)} avg × ${pricing.nights} night${pricing.nights > 1 ? 's' : ''}`} value={formatCurrency(pricing.baseAmount, c)} />
      {pricing.servicesBreakdown?.map((s) => (
        <Row key={s.id} label={<>{s.name} <span className="text-xs text-muted-foreground">({formatCurrency(s.price, c)} {UNIT_LABEL[s.unit]}{s.qty > 1 ? ` × ${s.qty}` : ''})</span></>} value={formatCurrency(s.amount, c)} />
      ))}
      {pricing.cleaningFee > 0 && <Row label="Cleaning fee" value={formatCurrency(pricing.cleaningFee, c)} muted />}
      {pricing.serviceCharge > 0 && <Row label={`Service charge (${pricing.serviceChargePercent}%)`} value={formatCurrency(pricing.serviceCharge, c)} muted />}
      {pricing.taxAmount > 0 && <Row label={`${pricing.taxLabel} (${pricing.taxPercent}%)`} value={formatCurrency(pricing.taxAmount, c)} muted />}
      <div className="border-t pt-3"><Row label="Total" value={formatCurrency(pricing.totalAmount, c)} strong /></div>
      {pricing.advanceAmount > 0 && pricing.advanceAmount < pricing.totalAmount && (
        <p className="text-xs text-muted-foreground">Advance to secure your dates after confirmation: <span className="font-medium text-foreground">{formatCurrency(pricing.advanceAmount, c)}</span></p>
      )}
    </div>
  )
}
