import { format, parseISO, differenceInCalendarDays, isValid } from 'date-fns'

export function formatCurrency(amount, currency = 'INR') {
  const n = Number(amount || 0)
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n)
}

/** Dates are stored as 'YYYY-MM-DD' strings to avoid timezone drift. */
export const toISODate = (d) => format(d, 'yyyy-MM-dd')
export const fromISODate = (s) => (s ? parseISO(s) : null)

/** Accepts ISO strings (API), Date objects or epoch ms. */
export const tsToDate = (v) => {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d }
  return null
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  if (!value) return '—'
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : tsToDate(value)
  return d && isValid(d) ? format(d, pattern) : '—'
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  return Math.max(0, differenceInCalendarDays(fromISODate(checkOut), fromISODate(checkIn)))
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?'

export function toCsv(rows, columns) {
  const esc = (v) => {
    let s = v == null ? '' : String(v)
    // Neutralise spreadsheet formula injection
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.map((c) => esc(c.label)).join(',')
  const body = rows
    .map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.value])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

export function downloadFile(content, filename, type = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function whatsappLink(number, text = '') {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const telLink = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`
