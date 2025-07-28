import { Metadata } from 'next'
import { headers } from 'next/headers'
import { detectLocale, generateMetadata } from './metadata'

export async function generatePageMetadata(pageKey: string): Promise<Metadata> {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  // Create a mock request object for locale detection
  const mockRequest = {
    headers: {
      get: (name: string) => name === 'accept-language' ? acceptLanguage : null
    }
  } as Request
  
  const locale = detectLocale(mockRequest)
  return generateMetadata(pageKey, locale)
}

// For client components that need metadata
export function generateStaticPageMetadata(pageKey: string, locale: 'ko' | 'en' = 'ko'): Metadata {
  return generateMetadata(pageKey, locale)
}