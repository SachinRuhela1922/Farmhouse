import { api } from '../api/client'

/** Admin CRUD for a content collection (accommodations, experiences, gallery, testimonials, faqs). */
export function createCrud(name) {
  const base = `/admin/content/${name}`
  return {
    name,
    create: (data) => api.post(base, data).then((r) => r.item),
    /** Full update (validated server-side). */
    update: (id, data) => api.put(`${base}/${id}`, data).then((r) => r.item),
    /** Partial update: visibility toggles, gallery title/category. */
    patch: (id, data) => api.patch(`${base}/${id}`, data).then((r) => r.item),
    remove: (id) => api.del(`${base}/${id}`),
    reorder: (ids) => api.post(`${base}/reorder`, { ids }),
  }
}

export const experiencesApi = createCrud('experiences')
export const testimonialsApi = createCrud('testimonials')
export const faqsApi = createCrud('faqs')

/** Merge-save a partial settings object (admin only). */
export const saveSettings = (partial) => api.put('/admin/settings', partial).then((r) => r.settings)

/* ---------------- Public submissions ---------------- */
export const submitContact = (data) => api.post('/contact', data)
export const subscribeNewsletter = (email) => api.post('/newsletter', { email }).then((r) => r.status)

export const contactsAdmin = {
  setStatus: (id, status) => api.patch(`/admin/contacts/${id}`, { status }),
  remove: (id) => api.del(`/admin/contacts/${id}`),
}
export const newsletterAdmin = {
  setStatus: (id, status) => api.patch(`/admin/newsletter/${id}`, { status }),
  remove: (id) => api.del(`/admin/newsletter/${id}`),
}

/** Fills empty collections with the complete starter content. */
export const installStarterContent = () => api.post('/admin/seed').then((r) => r.installed)
