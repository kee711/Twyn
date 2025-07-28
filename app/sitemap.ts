import { MetadataRoute } from 'next'
import { pageMetadata } from '@/lib/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://twyn.sh'
  const currentDate = new Date()

  // Create sitemap entries for both Korean and English versions
  const createLocalizedPages = (locale: 'ko' | 'en' = 'ko') => {
    const prefix = locale === 'en' ? '/en' : ''
    
    return Object.entries(pageMetadata)
      .filter(([key]) => !key.includes('settings') && !key.includes('dashboard'))
      .map(([key, page]) => ({
        url: `${baseUrl}${prefix}${page.path}`,
        lastModified: currentDate,
        changeFrequency: key === 'home' ? 'daily' as const : 'weekly' as const,
        priority: key === 'home' ? 1 : 0.8,
        alternates: {
          languages: {
            ko: `${baseUrl}${page.path}`,
            en: `${baseUrl}/en${page.path}`,
          }
        }
      }))
  }

  // Get Korean pages (default)
  const koreanPages = createLocalizedPages('ko')
  
  // Get English pages
  const englishPages = createLocalizedPages('en')

  // Add main dashboard pages (authenticated users only, but still good for SEO)
  const dashboardPages = [
    {
      url: `${baseUrl}/contents/topic-finder`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contents/post-radar`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/statistics`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  return [
    ...koreanPages,
    ...englishPages,
    ...dashboardPages,
  ]
}