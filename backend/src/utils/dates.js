export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Parse 'YYYY-MM-DD' as a UTC date (no timezone drift). Returns null when invalid. */
export function parseISODate(s) {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return null
  const d = new Date(`${s}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d
}
export const isoOf = (d) => d.toISOString().slice(0, 10)
export const addDaysUTC = (d, n) => new Date(d.getTime() + n * 86400000)

/** Today's date (YYYY-MM-DD) in the business timezone. */
export function todayIn(timezone = 'Asia/Kolkata') {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** Every night of a stay: [checkIn, checkOut). */
export function nightsOf(checkIn, checkOut) {
  const out = []
  for (let d = parseISODate(checkIn); d && isoOf(d) < checkOut; d = addDaysUTC(d, 1)) out.push(isoOf(d))
  return out
}
