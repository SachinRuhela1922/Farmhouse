import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { sized } from '@/utils/images'
import { toEmbedUrl } from './VideoShowcase'

/** Fullscreen lightbox with keyboard navigation, zoom and video support. */
export function Lightbox({ items, index, onClose, onIndex }) {
  const [zoom, setZoom] = useState(false)
  const item = index != null ? items[index] : null
  const go = useCallback((d) => { setZoom(false); onIndex((index + d + items.length) % items.length) }, [index, items.length, onIndex])

  useEffect(() => {
    if (index == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [index, go, onClose])

  const embed = item?.type === 'video' ? toEmbedUrl(item.imageUrl) : null

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={item.title || 'Image preview'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-[oklch(0.18_0.02_150/0.96)] backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80 sm:px-6">
            <div className="min-w-0 text-sm">
              <span className="font-medium text-white">{item.title}</span>
              {item.category && <span className="ml-3 text-white/50">{item.category}</span>}
              <span className="ml-3 text-white/40 tabular-nums">{index + 1} / {items.length}</span>
            </div>
            <div className="flex gap-1">
              {item.type !== 'video' && (
                <button onClick={() => setZoom((z) => !z)} className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label={zoom ? 'Zoom out' : 'Zoom in'}>
                  {zoom ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
                </button>
              )}
              <button onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close"><X className="size-5" /></button>
            </div>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6 sm:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <AnimatePresence mode="wait">
              <motion.div key={index} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className={zoom ? 'max-h-full max-w-full overflow-auto' : 'flex max-h-full max-w-full items-center justify-center'}>
                {item.type === 'video' ? (
                  embed ? <iframe src={embed} title={item.title} className="aspect-video w-[min(90vw,1100px)] rounded-lg" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    : <video src={item.imageUrl} controls autoPlay className="max-h-[80vh] max-w-full rounded-lg" />
                ) : (
                  <img
                    src={sized(item.imageUrl, zoom ? 2600 : 1800)}
                    alt={item.title || ''}
                    onClick={() => setZoom((z) => !z)}
                    className={zoom ? 'max-w-none cursor-zoom-out' : 'max-h-[80vh] max-w-full cursor-zoom-in rounded-lg object-contain'}
                    style={zoom ? { width: 'min(200vw, 2600px)' } : undefined}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            {items.length > 1 && (
              <>
                <button onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6" aria-label="Previous"><ChevronLeft /></button>
                <button onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6" aria-label="Next"><ChevronRight /></button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
