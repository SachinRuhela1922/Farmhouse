import { SiteSettings } from '../models/Content.js'
import { DEFAULT_SETTINGS } from '../data/defaults.js'

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

/** Deep-merge (objects merge, arrays/primitives replace). */
export function deepMerge(base, over) {
  if (!isObj(over)) return base
  const out = { ...base }
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue
    out[k] = isObj(v) && isObj(base?.[k]) ? deepMerge(base[k], v) : v
  }
  return out
}

/** Raw settings saved by the admin (may be partial). */
export async function getRawSettings() {
  const doc = await SiteSettings.findOne({ key: 'main' }).lean()
  return doc?.data || null
}

/** Settings merged over defaults — what the site & pricing engine use. */
export async function getSettings() {
  return deepMerge(DEFAULT_SETTINGS, (await getRawSettings()) || {})
}

/** Merge a partial update into the stored settings document. */
export async function saveSettings(partial) {
  const current = (await getRawSettings()) || {}
  const next = deepMerge(current, partial)
  await SiteSettings.updateOne({ key: 'main' }, { $set: { data: next } }, { upsert: true })
  return deepMerge(DEFAULT_SETTINGS, next)
}

/** Strip anything that must never leave the server (none today, kept for safety). */
export const publicSettings = (s) => s
