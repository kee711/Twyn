import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signin', '/privacy', '/data-deletion-policy'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/contents/',
          '/schedule/',
          '/statistics/',
          '/comments/',
          '/mentions/',
          '/settings/',
          '/onboarding/',
          '/_next/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/signin',
          '/privacy', 
          '/data-deletion-policy',
          '/contents/topic-finder',
          '/contents/post-radar',
          '/schedule',
          '/statistics',
        ],
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
    sitemap: 'https://twyn.sh/sitemap.xml',
    host: 'https://twyn.sh',
  }
}