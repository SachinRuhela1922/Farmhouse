export const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed']
export const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid', 'refund_pending', 'refunded', 'partially_refunded']
export const CONTACT_STATUSES = ['new', 'read', 'replied', 'archived']

export const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', pulse: true },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
  cancelled: { label: 'Cancelled', className: 'bg-stone-100 text-stone-700 ring-stone-200', dot: 'bg-stone-400' },
  completed: { label: 'Completed', className: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  unpaid: { label: 'Unpaid', className: 'bg-stone-100 text-stone-700 ring-stone-200', dot: 'bg-stone-400' },
  partially_paid: { label: 'Advance paid', className: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  refund_pending: { label: 'Refund pending', className: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500', pulse: true },
  refunded: { label: 'Refunded', className: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500' },
  partially_refunded: { label: 'Partly refunded', className: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500' },
  new: { label: 'New', className: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', pulse: true },
  read: { label: 'Read', className: 'bg-stone-100 text-stone-700 ring-stone-200', dot: 'bg-stone-400' },
  replied: { label: 'Replied', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  archived: { label: 'Archived', className: 'bg-stone-100 text-stone-500 ring-stone-200', dot: 'bg-stone-300' },
  subscribed: { label: 'Subscribed', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  unsubscribed: { label: 'Unsubscribed', className: 'bg-stone-100 text-stone-600 ring-stone-200', dot: 'bg-stone-400' },
  active: { label: 'Available', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  inactive: { label: 'Unavailable', className: 'bg-stone-100 text-stone-600 ring-stone-200', dot: 'bg-stone-400' },
}

export const AMENITY_OPTIONS = [
  'Private pool', 'Wi-Fi', 'Air conditioning', 'Parking', 'Smart TV', 'Kitchen', 'BBQ grill', 'Garden',
  'Power backup', 'Caretaker', 'Bonfire area', 'Music system', 'Hot water', 'Pet friendly', 'Breakfast',
  'Indoor games', 'Outdoor seating', 'CCTV', 'Lawn',
]
