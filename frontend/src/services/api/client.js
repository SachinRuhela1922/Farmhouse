/**
 * REST client for the Express/MongoDB backend.
 * - Access JWT is kept in memory only (never localStorage) and sent as a Bearer token.
 * - The refresh token lives in an httpOnly cookie; on 401 we transparently refresh once and retry.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

let accessToken = null
let refreshing = null
const listeners = new Set()

export const getAccessToken = () => accessToken
export function setAccessToken(t) { accessToken = t || null }
/** Notified when the session is lost (refresh failed) so the UI can sign out. */
export const onSessionExpired = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

/** Resolve server-relative media URLs (/api/media/:id) against the API origin. */
export const mediaUrl = (url) => (url && url.startsWith('/api/') ? `${API_BASE}${url}` : url)

export async function refreshSession() {
  refreshing ??= fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new ApiError(json?.error?.message || 'Session expired', res.status, json?.error?.code)
      setAccessToken(json.accessToken)
      return json
    })
    .finally(() => { refreshing = null })
  return refreshing
}

async function raw(path, { method = 'GET', body, headers, signal, isForm } = {}) {
  return fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: { ...(!isForm && body !== undefined && { 'Content-Type': 'application/json' }), ...(accessToken && { Authorization: `Bearer ${accessToken}` }), ...headers },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function request(path, opts = {}) {
  let res
  try {
    res = await raw(path, opts)
  } catch {
    throw new ApiError('Unable to reach the server. Please check your connection and try again.', 0, 'unavailable')
  }
  if (res.status === 401 && accessToken && !opts._retried && !path.startsWith('/auth/refresh')) {
    try {
      await refreshSession()
      return request(path, { ...opts, _retried: true })
    } catch {
      setAccessToken(null)
      listeners.forEach((fn) => fn())
    }
  }
  const json = res.status === 204 ? {} : await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status, json?.error?.code, json?.error?.details)
  return json
}

export const api = {
  get: (p, o) => request(p, { ...o, method: 'GET' }),
  post: (p, body, o) => request(p, { ...o, method: 'POST', body }),
  put: (p, body, o) => request(p, { ...o, method: 'PUT', body }),
  patch: (p, body, o) => request(p, { ...o, method: 'PATCH', body }),
  del: (p, o) => request(p, { ...o, method: 'DELETE' }),
}

/** Multipart upload with progress (XHR — fetch has no upload progress). */
export function uploadFile(path, formData, onProgress) {
  const send = () => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/api${path}`)
    xhr.withCredentials = true
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      let json = {}
      try { json = JSON.parse(xhr.responseText) } catch { /* empty */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json)
      else reject(new ApiError(json?.error?.message || `Upload failed (${xhr.status})`, xhr.status, json?.error?.code))
    }
    xhr.onerror = () => reject(new ApiError('Upload failed — network error.', 0, 'unavailable'))
    xhr.send(formData)
  })
  return send().catch(async (e) => {
    if (e.status !== 401) throw e
    await refreshSession()
    return send()
  })
}

export const errorMessage = (e) => e?.message || 'Something went wrong.'
