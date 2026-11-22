import mongoose from 'mongoose'
import multer from 'multer'
import { ZodError } from 'zod'
import { ApiError } from '../utils/http.js'
import { env } from '../config/env.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'not-found' } })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500
  let body = { message: 'Something went wrong. Please try again.', code: 'internal' }

  if (err instanceof ApiError) {
    status = err.status
    body = { message: err.message, code: err.code, details: err.details }
  } else if (err instanceof ZodError) {
    status = 400
    body = { message: err.issues[0]?.message || 'Invalid input.', code: 'invalid-argument', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) }
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400
    body = { message: Object.values(err.errors)[0]?.message || 'Invalid data.', code: 'invalid-argument' }
  } else if (err instanceof mongoose.Error.CastError) {
    status = 404
    body = { message: 'Not found.', code: 'not-found' }
  } else if (err?.code === 11000) {
    status = 409
    body = { message: 'That record already exists.', code: 'already-exists' }
  } else if (err instanceof multer.MulterError) {
    status = 400
    body = { message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message, code: 'invalid-argument' }
  } else if (err?.type === 'entity.parse.failed') {
    status = 400
    body = { message: 'Malformed JSON body.', code: 'invalid-argument' }
  }

  if (status >= 500) console.error('[error]', req.method, req.originalUrl, err)
  else if (!env.isProd && !env.isTest && status !== 401) console.warn('[warn]', status, req.method, req.originalUrl, body.message)
  res.status(status).json({ error: body })
}
