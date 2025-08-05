'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ErrorPage() {
  const t = useTranslations('pages.error')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string) => {
    return t(`messages.${error}`) || t('messages.default')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-destructive">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {error ? getErrorMessage(error) : t('fallbackMessage')}
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              {t('backToSignin')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 