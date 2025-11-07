'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function ErrorPage() {
  const t = useTranslations('pages.error')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [showDebug, setShowDebug] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const getErrorMessage = (error: string) => {
    return t(`messages.${error}`) || t('messages.default')
  }

  // Detect if running in Base mini app
  const isBaseMiniApp = typeof window !== 'undefined' &&
    (window.location.hostname.includes('base.eth') ||
      window.navigator.userAgent.includes('Base'));

  // Collect all debug information
  const debugInfo = {
    error: error || 'none',
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    isBaseMiniApp,
    searchParams: Object.fromEntries(searchParams.entries()),
    localStorage: typeof window !== 'undefined' ? {
      hasSession: !!localStorage.getItem('next-auth.session-token') || !!localStorage.getItem('__Secure-next-auth.session-token'),
    } : {},
  }

  const handleRetry = () => {
    setIsRetrying(true);
    // Clear storage and redirect
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      // Reload the page to trigger Base Account detection again
      window.location.href = '/signin';
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-destructive">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {error ? getErrorMessage(error) : t('fallbackMessage')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Retry button for Base mini app */}
          {isBaseMiniApp && (
            <Button
              className="w-full"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? '🔄 Retrying...' : '🔄 Retry Login'}
            </Button>
          )}

          <Button asChild className="w-full" variant={isBaseMiniApp ? "outline" : "default"}>
            <Link href="/signin">
              {t('backToSignin')}
            </Link>
          </Button>

          {/* Debug Section Toggle */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? '🔽 Hide Debug Info' : '🔼 Show Debug Info'}
          </Button>

          {/* Debug Information */}
          {showDebug && (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                <h3 className="text-sm font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                  🐛 Debug Information
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border overflow-auto max-h-96">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                        alert('Debug info copied to clipboard!')
                      }}
                      className="text-xs"
                    >
                      📋 Copy Debug Info
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.clear()
                          sessionStorage.clear()
                          alert('Storage cleared! Please try again.')
                          window.location.href = '/signin'
                        }
                      }}
                      className="text-xs"
                    >
                      🗑️ Clear Storage & Retry
                    </Button>
                  </div>
                </div>
              </div>

              {/* Console Logs Section */}
              <div className="rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 p-4">
                <h3 className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  📝 Recent Console Logs
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Open browser DevTools (F12) → Console tab to see detailed logs
                </p>
                <div className="bg-white dark:bg-gray-900 p-3 rounded border text-xs">
                  <p className="text-muted-foreground">
                    Look for logs starting with:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 font-mono">
                    <li>[SignIn]</li>
                    <li>[Base Account API]</li>
                    <li>[authOptions]</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 