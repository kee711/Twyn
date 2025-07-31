import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const locales = ['en', 'ko']
const defaultLocale = 'en'

const authMiddleware = withAuth(
  function middleware(req) {
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 Middleware - pathname:', pathname)

  // Skip for API routes, _next static files, and other internal paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/icon') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    console.log('⏭️ Skipping middleware for:', pathname)
    return NextResponse.next()
  }

  // Extract locale from pathname
  let locale = defaultLocale
  let pathnameWithoutLocale = pathname

  // Check if pathname already has locale
  const pathnameHasLocale = locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  )

  if (pathnameHasLocale) {
    // Extract locale and remove it from pathname
    const segments = pathname.split('/')
    locale = segments[1]
    pathnameWithoutLocale = '/' + segments.slice(2).join('/')
    if (pathnameWithoutLocale === '/') pathnameWithoutLocale = '/'
  } else {
    // If no locale, redirect to default locale
    console.log('🔄 Redirecting to default locale')
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
  }

  console.log('🌐 Locale:', locale, 'Path:', pathnameWithoutLocale)

  // Check if path needs authentication
  const protectedPaths = ['/schedule', '/contents', '/statistics', '/comments', '/settings', '/mentions']
  const needsAuth = protectedPaths.some(path => pathnameWithoutLocale.startsWith(path))

  console.log('🔐 Auth check - needsAuth:', needsAuth)

  // Create response with locale header
  let response: NextResponse

  if (needsAuth) {
    console.log('🔒 Running auth middleware')
    const authResponse = await (authMiddleware as any)(request)
    if (authResponse) {
      response = authResponse
    } else {
      response = NextResponse.rewrite(new URL(pathnameWithoutLocale, request.url))
    }
  } else {
    response = NextResponse.rewrite(new URL(pathnameWithoutLocale, request.url))
  }

  // Add locale to headers for the app to use
  response.headers.set('x-locale', locale)

  console.log('✅ Continuing with locale:', locale)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|opengraph-image|apple-icon|icon).*)',
  ]
}