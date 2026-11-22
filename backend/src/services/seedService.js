import { Accommodation, Experience, Gallery, Testimonial, Faq, SiteSettings } from '../models/Content.js'
import {
  DEFAULT_SETTINGS, STARTER_ACCOMMODATIONS, STARTER_EXPERIENCES, STARTER_GALLERY, STARTER_TESTIMONIALS, STARTER_FAQS,
} from '../data/defaults.js'

/**
 * Install starter content into EMPTY collections only (never overwrites).
 * With { reset: true } (CLI only) the content collections are wiped and fully re-seeded.
 */
export async function installStarterContent({ reset = false } = {}) {
  const plan = [
    ['accommodations', Accommodation, STARTER_ACCOMMODATIONS],
    ['experiences', Experience, STARTER_EXPERIENCES],
    ['gallery', Gallery, STARTER_GALLERY],
    ['testimonials', Testimonial, STARTER_TESTIMONIALS],
    ['faqs', Faq, STARTER_FAQS],
  ]
  const installed = []
  for (const [name, Model, items] of plan) {
    if (reset) await Model.deleteMany({})
    if ((await Model.estimatedDocumentCount()) === 0) {
      await Model.insertMany(items)
      installed.push(`${name} (${items.length})`)
    }
  }
  if (reset) await SiteSettings.deleteMany({})
  if (!(await SiteSettings.exists({ key: 'main' }))) {
    await SiteSettings.create({ key: 'main', data: DEFAULT_SETTINGS })
    installed.push('site settings')
  }
  return installed
}
