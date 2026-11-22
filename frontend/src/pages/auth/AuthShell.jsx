import { Img } from '@/components/common/Primitives'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { motion } from 'framer-motion'

/** Split-screen auth layout: image left, form right. */
export function AuthShell({ title, subtitle, children, footer }) {
  const { settings } = useSiteSettings()
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Img src={settings.hero.images?.[0]?.url} alt="" className="absolute inset-0 size-full" eager width={1400} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-14 text-white">
          <p className="font-serif text-4xl leading-tight">“{settings.about.mission}”</p>
          <p className="mt-4 text-sm text-white/70">{settings.businessName}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 pb-16 pt-32 sm:px-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <h1 className="text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </div>
    </div>
  )
}
