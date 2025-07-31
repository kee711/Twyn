'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLocaleContext } from '@/components/providers/LocaleProvider'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const { t, locale } = useLocaleContext()

  const getErrorMessage = (error: string) => {
    const messageKey = `pages.error.messages.${error}` as const;
    return t(messageKey) !== messageKey ? t(messageKey) : t('pages.error.messages.default');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-destructive">{t('pages.error.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {error ? getErrorMessage(error) : t('pages.error.fallbackMessage')}
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href={`/${locale}/signin`}>
              {t('pages.error.backToSignin')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 