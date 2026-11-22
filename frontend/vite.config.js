import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/** Emits sitemap.xml and robots.txt at build time using VITE_SITE_URL. */
function seoFiles(siteUrl) {
  const routes = ['/', '/about', '/accommodation', '/experiences', '/gallery', '/booking', '/contact']
  return {
    name: 'seo-files',
    generateBundle() {
      const base = (siteUrl || 'https://example.com').replace(/\/$/, '')
      const today = new Date().toISOString().slice(0, 10)
      const urls = routes
        .map((r) => `  <url><loc>${base}${r}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${r === '/' ? '1.0' : '0.8'}</priority></url>`)
        .join('\n')
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nSitemap: ${base}/sitemap.xml\n` })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), tailwindcss(), seoFiles(env.VITE_SITE_URL)],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
    // Dev: proxy API calls to the Express backend so cookies stay same-origin
    server: { proxy: { '/api': { target: env.VITE_DEV_API_TARGET || 'http://localhost:5000', changeOrigin: true } } },
    preview: { proxy: { '/api': { target: env.VITE_DEV_API_TARGET || 'http://localhost:5000', changeOrigin: true } } },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase'
              if (id.includes('recharts') || id.includes('d3-')) return 'charts'
              if (id.includes('framer-motion')) return 'motion'
            }
          },
        },
      },
    },
  }
})
