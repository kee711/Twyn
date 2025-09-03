import { withAuth } from 'next-auth/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { getToken } from 'next-auth/jwt'

const publicPages = ['/', '/signin', '/signup', '/error', '/privacy', '/data-deletion-policy']

const intlMiddleware = createIntlMiddleware(routing)

const authMiddleware = withAuth(
  async function onSuccess(req) {
    const token = await getToken({ req })
    const pathname = req.nextUrl.pathname

    // Check if user needs onboarding
    if (token?.needsOnboarding && !pathname.includes('/onboarding')) {
      const onboardingUrl = new URL('/onboarding', req.url)
      onboardingUrl.searchParams.set('type', 'user')
      return NextResponse.redirect(onboardingUrl)
    }

    // If user is on onboarding page but doesn't need it, redirect to dashboard
    if (!token?.needsOnboarding && pathname.includes('/onboarding')) {
      return NextResponse.redirect(new URL('/contents/topic-finder', req.url))
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
  }
)

export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap(p => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  )
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname)

  if (isPublicPage) {
    return intlMiddleware(req)
  } else {
    return (authMiddleware as any)(req)
  }
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}