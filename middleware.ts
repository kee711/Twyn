import { withAuth } from 'next-auth/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { getToken } from 'next-auth/jwt'
import { featureFlags, web3Config } from './lib/config/web3'

const publicPages = ['/', '/signin', '/signup', '/error', '/privacy', '/data-deletion-policy', '/test-base']

const intlMiddleware = createIntlMiddleware(routing)

const authMiddleware = withAuth(
  async function onSuccess(req) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token'
    })
    const pathname = req.nextUrl.pathname

    // Check if user needs onboarding
    if (token?.needsOnboarding && !pathname.includes('/onboarding')) {
      const onboardingUrl = new URL('/onboarding', req.url)
      onboardingUrl.searchParams.set('type', 'user')
      return NextResponse.redirect(onboardingUrl)
    }

    // If user is on onboarding page but doesn't need it, allow forcing via query param
    if (!token?.needsOnboarding && pathname.includes('/onboarding')) {
      const forceParam = req.nextUrl.searchParams.get('force')
      const allowForce = forceParam === '1' || forceParam === 'true'
      if (!allowForce) {
        // In web3 mode, redirect to topic-finder; otherwise use existing logic
        const redirectPath = featureFlags.enableDirectSigninRouting()
          ? web3Config.defaultRedirectPath
          : '/contents/topic-finder'
        return NextResponse.redirect(new URL(redirectPath, req.url))
      }
    }

    // Remove locale prefix for checking
    const pathnameWithoutLocale = routing.locales.reduce(
      (path, locale) => path.replace(new RegExp(`^/${locale}(/|$)`), '/'),
      pathname
    )

    // Redirect dashboard root to topic-finder
    if (pathnameWithoutLocale === '/dashboard' || pathnameWithoutLocale === '/dashboard/') {
      return NextResponse.redirect(new URL('/contents/topic-finder', req.url))
    }

    // In web3 mode, redirect authenticated users from root to topic-finder
    if (featureFlags.enableDirectSigninRouting() && token) {
      // If authenticated user is on root path, redirect to topic-finder
      if (pathnameWithoutLocale === '/' || pathnameWithoutLocale === '') {
        return NextResponse.redirect(new URL(web3Config.defaultRedirectPath, req.url))
      }
    }

    return intlMiddleware(req)
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null,
    },
    pages: {
      signIn: '/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
)

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Remove locale prefix for checking
  const pathnameWithoutLocale = routing.locales.reduce(
    (path, locale) => path.replace(new RegExp(`^/${locale}(/|$)`), '/'),
    pathname
  )

  // In web3 mode, redirect root path to signin (unauthenticated users)
  if (featureFlags.enableDirectSigninRouting()) {
    if (pathnameWithoutLocale === '/' || pathnameWithoutLocale === '') {
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  }

  // Check if it's a public page
  const isPublicPage = publicPages.some(page =>
    pathnameWithoutLocale === page ||
    pathnameWithoutLocale.startsWith(`${page}/`)
  )

  // Always apply intl middleware for public pages
  if (isPublicPage) {
    return intlMiddleware(req)
  } else {
    return (authMiddleware as any)(req)
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
