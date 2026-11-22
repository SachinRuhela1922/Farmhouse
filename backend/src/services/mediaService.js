import mongoose from 'mongoose'
import { Readable } from 'node:stream'
import { mediaBucket } from '../config/db.js'
import { badRequest, notFound } from '../utils/http.js'

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm']

/** Verify magic bytes so a renamed file can't masquerade as an image. */
function sniff(buf) {
  const hex = buf.subarray(0, 12).toString('hex')
  if (hex.startsWith('ffd8ff')) return 'image/jpeg'
  if (hex.startsWith('89504e47')) return 'image/png'
  if (hex.startsWith('47494638')) return 'image/gif'
  if (hex.startsWith('52494646') && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  if (buf.subarray(4, 12).toString() === 'ftypavif') return 'image/avif'
  if (buf.subarray(4, 8).toString() === 'ftyp') return 'video/mp4'
  if (hex.startsWith('1a45dfa3')) return 'video/webm'
  return null
}

/** Store an uploaded file in GridFS (MongoDB Atlas). Returns { mediaId, url, type }. */
export async function storeMedia(file, { folder = 'misc', uploadedBy } = {}) {
  if (!file) throw badRequest('No file uploaded.')
  const detected = sniff(file.buffer)
  const isImage = IMAGE_TYPES.includes(detected)
  const isVideo = VIDEO_TYPES.includes(detected)
  if (!isImage && !isVideo) throw badRequest('Only JPEG, PNG, WebP, AVIF, GIF images or MP4/WebM videos are allowed.')
  if (isImage && file.size > MAX_IMAGE_BYTES) throw badRequest('Images must be under 15 MB.')
  if (isVideo && file.size > MAX_VIDEO_BYTES) throw badRequest('Videos must be under 100 MB.')

  const safeName = (file.originalname || 'file').toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60)
  const upload = mediaBucket().openUploadStream(safeName, { metadata: { contentType: detected, folder, uploadedBy: String(uploadedBy || '') } })
  await new Promise((resolve, reject) => Readable.from(file.buffer).pipe(upload).on('finish', resolve).on('error', reject))
  const mediaId = String(upload.id)
  return { mediaId, url: `/api/media/${mediaId}`, type: isVideo ? 'video' : 'image' }
}

export async function findMedia(id) {
  if (!mongoose.isValidObjectId(id)) throw notFound()
  const [file] = await mediaBucket().find({ _id: new mongoose.Types.ObjectId(id) }).toArray()
  if (!file) throw notFound()
  return file
}

/** Stream a file with HTTP Range support (needed for video seeking). */
export async function streamMedia(id, req, res) {
  const file = await findMedia(id)
  const type = file.metadata?.contentType || 'application/octet-stream'
  const etag = `"${file._id}"`
  res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', ETag: etag, 'Accept-Ranges': 'bytes', 'Cross-Origin-Resource-Policy': 'cross-origin' })
  if (req.get('if-none-match') === etag) return res.status(304).end()

  const range = req.get('range')
  const _id = file._id
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range)
    const start = m?.[1] ? Number(m[1]) : 0
    const end = m?.[2] ? Math.min(Number(m[2]), file.length - 1) : file.length - 1
    if (start >= file.length || start > end) return res.status(416).set('Content-Range', `bytes */${file.length}`).end()
    res.status(206).set({ 'Content-Range': `bytes ${start}-${end}/${file.length}`, 'Content-Length': end - start + 1 })
    return mediaBucket().openDownloadStream(_id, { start, end: end + 1 }).pipe(res)
  }
  res.set('Content-Length', file.length)
  mediaBucket().openDownloadStream(_id).on('error', () => res.status(404).end()).pipe(res)
}

/** Delete a GridFS file; ignores external URLs and already-missing files. */
export async function deleteMedia(id) {
  if (!id || !mongoose.isValidObjectId(id)) return
  try {
    await mediaBucket().delete(new mongoose.Types.ObjectId(id))
  } catch (e) {
    if (!/FileNotFound|not found/i.test(e.message)) throw e
  }
}

/** Extract a GridFS id from a /api/media/<id> URL. */
export const mediaIdFromUrl = (url = '') => /\/api\/media\/([a-f0-9]{24})/.exec(url)?.[1] || null
