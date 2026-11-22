import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { Img, Reveal } from './Primitives'

/** Convert YouTube / Vimeo share URLs into embeddable URLs. Returns null for direct video files. */
export function toEmbedUrl(url = '') {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`
  return null
}

export function VideoShowcase() {
  const { settings } = useSiteSettings()
  const v = settings.videoShowcase
  const [playing, setPlaying] = useState(false)
  const embed = toEmbedUrl(v.videoUrl)

  return (
    <section className="section">
      <div className="container-lux">
        <Reveal className="relative overflow-hidden rounded-[28px] shadow-lift">
          <div className="relative aspect-[16/10] sm:aspect-[21/9]">
            <Img src={v.posterUrl} alt={v.title} className="absolute inset-0 size-full" width={2000} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-12">
              <div className="max-w-lg">
                <p className="eyebrow text-white/75">Video showcase</p>
                <h2 className="mt-3 text-4xl sm:text-5xl">{v.title}</h2>
                <p className="mt-3 text-white/80">{v.subtitle}</p>
              </div>
              {v.videoUrl && (
                <button onClick={() => setPlaying(true)} className="group flex items-center gap-4 self-start sm:self-end" aria-label="Play video">
                  <span className="relative grid size-20 place-items-center rounded-full bg-white/95 text-primary transition group-hover:scale-105">
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2.4s]" />
                    <Play className="relative ml-1 size-7 fill-current" />
                  </span>
                  <span className="text-sm font-semibold tracking-wide">Watch the film</span>
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4" onClick={() => setPlaying(false)}>
            <button className="absolute right-4 top-4 grid size-11 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close video"><X /></button>
            <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              {embed ? (
                <iframe src={embed} title={v.title} className="aspect-video w-full rounded-xl" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              ) : (
                <video src={v.videoUrl} controls autoPlay className="aspect-video w-full rounded-xl bg-black" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
