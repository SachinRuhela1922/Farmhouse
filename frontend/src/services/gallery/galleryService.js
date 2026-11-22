import { createCrud } from '../content/contentService'
import { uploadMedia } from '../storage/uploadService'

export const galleryApi = createCrud('gallery')

/** Upload a file (GridFS) and create its gallery record. */
export async function uploadGalleryItem(file, { category, title, displayOrder }, onProgress) {
  const { url, mediaId, type } = await uploadMedia(file, 'gallery', { onProgress, allowVideo: true })
  return galleryApi.create({
    type, imageUrl: url, mediaId, category: category || 'Uncategorised',
    title: title || file.name.replace(/\.[^.]+$/, ''), displayOrder: displayOrder ?? 999, isActive: true,
  })
}

/** Delete the record; the API also removes its stored media. */
export const deleteGalleryItem = (item) => galleryApi.remove(item.id)
