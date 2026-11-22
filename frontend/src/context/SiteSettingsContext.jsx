import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api/client'
import { DEFAULT_SETTINGS } from '@/utils/defaults'

const SiteSettingsContext = createContext({ settings: DEFAULT_SETTINGS, loading: false })

/** Deep-merge server settings over defaults so missing keys never break the UI. */
export function mergeSettings(base, over) {
  if (!over) return base
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base?.[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) out[k] = mergeSettings(base[k], v)
    else if (v !== undefined && v !== null) out[k] = v
  }
  return out
}

export const SETTINGS_KEY = ['settings']

export function SiteSettingsProvider({ children }) {
  const { data, isLoading } = useQuery({ queryKey: SETTINGS_KEY, queryFn: () => api.get('/settings').then((r) => r.settings), staleTime: 60_000 })
  const value = useMemo(() => ({ settings: mergeSettings(DEFAULT_SETTINGS, data), raw: data, loading: isLoading }), [data, isLoading])
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
