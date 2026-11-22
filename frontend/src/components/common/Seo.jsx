import { useSiteSettings } from '@/context/SiteSettingsContext'

/**
 * Per-page title & meta. React 19 hoists <title>/<meta>/<link> into <head> automatically.
 */
export function Seo({ title, description, image, noindex = false, path }) {
  const { settings } = useSiteSettings()
  const brand = settings.businessName
  const fullTitle = title ? `${title} — ${brand}` : `${brand} — ${settings.tagline}`
  const desc = description || settings.hero?.subtitle
  const site = import.meta.env.VITE_SITE_URL
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
      {site && path != null && <link rel="canonical" href={`${site.replace(/\/$/, '')}${path}`} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </>
  )
}
