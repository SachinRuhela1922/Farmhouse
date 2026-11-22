import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api/client'

/**
 * Data hook returning the same { data, loading, error, refetch } shape the pages use.
 * `key` is a react-query key; `path` is the API path; `select` maps the JSON response.
 */
export function useApi(key, path, { select = (r) => r, enabled = true, refetchInterval, sort } = {}) {
  const q = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => api.get(path, { signal }),
    enabled: enabled && !!path,
    refetchInterval,
    select: (r) => {
      const d = select(r)
      return sort && Array.isArray(d) ? [...d].sort(sort) : d
    },
  })
  return { data: q.data ?? (enabled ? null : null), loading: enabled && !!path ? q.isLoading : false, error: q.error, refetch: q.refetch }
}

/** Invalidate by key prefix after mutations, e.g. invalidate('bookings'). */
export function useInvalidate() {
  const qc = useQueryClient()
  return (...prefixes) => Promise.all(prefixes.map((p) => qc.invalidateQueries({ queryKey: Array.isArray(p) ? p : [p] })))
}

export const byOrder = (a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)
export const byCreatedDesc = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
