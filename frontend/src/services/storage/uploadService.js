import { api, uploadFile } from '../api/client'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024

/**
 * Downscale + re-encode images in the browser before upload (WebP, max 2400px).
 * Keeps uploads light and pages fast. Falls back to the original file on failure.
 */
export async function optimizeImage(file, { maxSize = 2400, quality = 0.84 } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

export function validateMedia(file, { allowVideo = false } = {}) {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isImage && !(allowVideo && isVideo)) return allowVideo ? 'Only images or videos are allowed.' : 'Only image files are allowed.'
  if (isImage && file.size > MAX_IMAGE_BYTES) return 'Images must be under 15 MB.'
  if (isVideo && file.size > MAX_VIDEO_BYTES) return 'Videos must be under 100 MB.'
  return null
}

/**
 * Upload to the backend, which stores the file in MongoDB GridFS.
 * Returns { url: '/api/media/<id>', mediaId, type }. Admin only (enforced by the API).
 */
export async function uploadMedia(file, folder, { onProgress, allowVideo = false } = {}) {
  const err = validateMedia(file, { allowVideo })
  if (err) throw new Error(err)
  const toUpload = file.type.startsWith('video/') ? file : await optimizeImage(file)
  const fd = new FormData()
  fd.append('folder', folder)
  fd.append('file', toUpload, toUpload.name)
  return uploadFile('/admin/media', fd, onProgress)
}

/** Delete an uploaded file (ignores external URLs). */
export async function deleteMedia(mediaId) {
  if (!mediaId) return
  await api.del(`/admin/media/${mediaId}`).catch(() => {})
}
