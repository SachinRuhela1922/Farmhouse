/** Typed HTTP error with a client-safe message. */
export class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}
export const badRequest = (m, d) => new ApiError(400, m, 'invalid-argument', d)
export const unauthorized = (m = 'Please sign in to continue.') => new ApiError(401, m, 'unauthenticated')
export const forbidden = (m = 'You do not have permission to do that.') => new ApiError(403, m, 'permission-denied')
export const notFound = (m = 'Not found.') => new ApiError(404, m, 'not-found')
export const conflict = (m) => new ApiError(409, m, 'already-exists')
export const precondition = (m) => new ApiError(412, m, 'failed-precondition')
export const tooMany = (m) => new ApiError(429, m, 'resource-exhausted')

/** Validate req[part] with a Zod schema; replaces it with the parsed (coerced, stripped) value. */
export const validate = (schema, part = 'body') => (req, _res, next) => {
  const r = schema.safeParse(req[part] ?? {})
  if (!r.success) {
    const issue = r.error.issues[0]
    return next(badRequest(issue?.message || 'Invalid input.', r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))))
  }
  if (part === 'query') req.validQuery = r.data
  else req[part] = r.data
  next()
}

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
