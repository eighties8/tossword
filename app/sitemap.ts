import type { MetadataRoute } from 'next'

const BASE_URL = 'https://tossword.app' // TODO: set to your domain

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()
  const staticPaths = [
    '/',
    '/privacy',
    '/terms',
    '/cookies',
    '/contact',
    '/about',
  ]

  return staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }))
}


