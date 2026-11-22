import { api } from '../api/client'
import { createCrud } from '../content/contentService'

export const accommodationsApi = createCrud('accommodations')

export const slugify = (s = '') =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

/** Active accommodation by slug (or id). Returns null when unavailable. */
export async function getAccommodationBySlug(slug) {
  try {
    return (await api.get(`/accommodations/${encodeURIComponent(slug)}`)).item
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}
