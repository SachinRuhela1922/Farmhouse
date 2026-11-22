import { useMemo, useState } from 'react'
import { Images, Film } from 'lucide-react'
import { Seo } from '@/components/common/Seo'
import { PageHero, EmptyState, ErrorState } from '@/components/common/Primitives'
import { MasonryGallery } from '@/components/common/Sections'
import { useGallery } from '@/hooks/useContent'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { cn } from '@/lib/utils'

export default function GalleryPage() {
  const { data, loading, error } = useGallery()
  const { settings } = useSiteSettings()
  const [cat, setCat] = useState('All')
  const items = useMemo(() => data || [], [data])
  const cats = useMemo(() => {
    const used = new Set(items.filter((i) => i.type !== 'video').map((i) => i.category))
    return ['All', ...settings.galleryCategories.filter((c) => used.has(c)), ...[...used].filter((c) => !settings.galleryCategories.includes(c))]
  }, [items, settings.galleryCategories])
  const photos = items.filter((i) => i.type !== 'video' && (cat === 'All' || i.category === cat))
  const videos = items.filter((i) => i.type === 'video')

  return (
    <>
      <Seo title="Gallery" description="Photos and films of the farmhouse, pool, rooms, dining and celebrations." path="/gallery" />
      <PageHero eyebrow="Gallery" title="Seen through the seasons" subtitle="Golden mornings, long lunches and starlit evenings." image={items[0]?.imageUrl || settings.hero.images?.[0]?.url} />
      <section className="section pt-14">
        <div className="container-lux">
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                className={cn('rounded-full px-5 py-2 text-sm font-medium ring-1 transition', cat === c ? 'bg-primary text-primary-foreground ring-primary' : 'bg-white ring-border hover:ring-primary/40')}>
                {c}
              </button>
            ))}
          </div>
          {error && <ErrorState error={error} />}
          {!loading && !error && photos.length === 0 && <EmptyState icon={Images} title="No photos in this category yet" />}
          <MasonryGallery items={photos} loading={loading} />

          {videos.length > 0 && (
            <div className="mt-24">
              <div className="mb-8 flex items-center gap-3"><Film className="size-5 text-primary" /><h2 className="text-4xl">Video gallery</h2></div>
              <MasonryGallery items={videos} columns="columns-1 sm:columns-2" />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
