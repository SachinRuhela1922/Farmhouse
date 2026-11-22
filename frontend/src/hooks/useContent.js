import { useMemo } from 'react'
import { useApi } from './useApi'

const items = (r) => r.items

/* Public content (only active / published items are returned by the API). */
export const useAccommodations = () => useApi(['public', 'accommodations'], '/accommodations', { select: items })
export const useExperiences = () => useApi(['public', 'experiences'], '/experiences', { select: items })
export const useGallery = () => useApi(['public', 'gallery'], '/gallery', { select: items })
export const useTestimonials = () => useApi(['public', 'testimonials'], '/testimonials', { select: items })
export const useFaqs = () => useApi(['public', 'faqs'], '/faqs', { select: items })

/* Admin: every document in a content collection. */
export const useAdminCollection = (name) => useApi(['admin', 'content', name], `/admin/content/${name}`, { select: items })

/** Booked nights (YYYY-MM-DD) for an accommodation, as a Set. Refreshes every 30s. */
export function useBookedDates(accommodationId) {
  const { data, loading } = useApi(['availability', accommodationId], accommodationId ? `/availability/${accommodationId}` : null, {
    select: (r) => r.dates, enabled: !!accommodationId, refetchInterval: 30_000,
  })
  const bookedDates = useMemo(() => new Set(data || []), [data])
  return { bookedDates, loading }
}
