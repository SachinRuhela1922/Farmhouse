import { motion } from 'framer-motion'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { whatsappLink } from '@/utils/format'
import { WhatsAppIcon } from './BrandIcons'

export function WhatsAppFab() {
  const { settings } = useSiteSettings()
  const href = whatsappLink(settings.contact.whatsapp, `Hello ${settings.businessName}, I'd like to enquire about a stay.`)
  if (!href) return null
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift sm:bottom-8 sm:right-8"
    >
      <WhatsAppIcon width={26} height={26} />
    </motion.a>
  )
}
