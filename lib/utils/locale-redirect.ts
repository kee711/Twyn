// Utility function to create locale-aware redirects for API routes
export function createLocaleRedirect(basePath: string, locale?: string) {
  const baseUrl = process.env.NEXTAUTH_URL;
  const localePrefix = locale && locale !== 'en' ? `/${locale}` : '/en';
  return `${baseUrl}${localePrefix}${basePath}`;
}

// Extract locale from various sources (headers, query params, etc.)
export function extractLocaleFromRequest(req: Request): string {
  const url = new URL(req.url);
  
  // Try to get locale from query parameter
  const localeParam = url.searchParams.get('locale');
  if (localeParam && ['en', 'ko'].includes(localeParam)) {
    return localeParam;
  }
  
  // Try to get locale from referer header
  const referer = req.headers.get('referer');
  if (referer) {
    const refererUrl = new URL(referer);
    const pathSegments = refererUrl.pathname.split('/');
    const potentialLocale = pathSegments[1];
    if (potentialLocale && ['en', 'ko'].includes(potentialLocale)) {
      return potentialLocale;
    }
  }
  
  // Default to English
  return 'en';
}