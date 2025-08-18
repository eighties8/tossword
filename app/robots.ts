import type { MetadataRoute } from 'next'

// Allow assets, block API, and link to sitemap
export default function robots(): MetadataRoute.Robots {
  const base = 'https://tossword.app' // TODO: set to your domain
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image/', '/public/'],
        disallow: ['/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}


