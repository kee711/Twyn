import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Check if pathname already has locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  console.log('🌐 Has locale:', pathnameHasLocale)

  // If no locale, redirect to default locale
  if (!pathnameHasLocale) {
    console.log('🔄 Redirecting to default locale')
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
  }

  // Check if path needs authentication (remove locale prefix for checking)
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
  const protectedPaths = ['/dashboard', '/schedule', '/contents', '/statistics', '/comments']
  const needsAuth = protectedPaths.some(path => pathnameWithoutLocale.startsWith(path))

  console.log('🔐 Auth check - pathnameWithoutLocale:', pathnameWithoutLocale, 'needsAuth:', needsAuth)

  if (needsAuth) {
    console.log('🔒 Running auth middleware')
    const authResponse = await (authMiddleware as any)(request)
    if (authResponse) return authResponse
  }

  console.log('✅ Continuing with request')
  return NextResponse.next()
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