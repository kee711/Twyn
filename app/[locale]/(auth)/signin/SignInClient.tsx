'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { checkOnboardingStatus } from '@/lib/utils/check-onboarding'
import { SocialButton } from '@/components/signin/buttons/social-button'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { featureFlags } from '@/lib/config/web3'
import { useSignIn, QRCode } from '@farcaster/auth-kit'
import type { StatusAPIResponse } from '@farcaster/auth-client'

export default function SignInClient() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/contents/topic-finder'
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Farcaster authentication state
  const [isFarcasterModalOpen, setIsFarcasterModalOpen] = useState(false)
  const hasProcessedSignInRef = useRef(false)
  const lastProcessedFidRef = useRef<number | null>(null)

  // Check for error messages in URL after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      const error = searchParams.get('error')

      if (error === 'AccessDenied' || error === 'OAuthAccountNotLinked') {
        // Check if we're coming from a signup attempt by checking for signup cookie
        fetch('/api/auth/check-signup-intent')
          .then(res => res.json())
          .then(data => {
            if (data.isSignupIntent) {
              // This was a signup attempt with existing user
              toast.error(t('alreadyRegisteredSignIn'), {
                duration: 4000,
                position: 'top-center'
              })
            } else {
              // Regular sign in failure
              toast.error(t('accountNotFound'), {
                duration: 4000,
                position: 'top-center'
              })
            }
          })
          .catch(() => {
            // Fallback error message
            toast.error(t('signInError'), {
              duration: 4000,
              position: 'top-center'
            })
          })

        // Clear the error parameter from URL
        const newSearchParams = new URLSearchParams(searchParams.toString())
        newSearchParams.delete('error')
        const newUrl = newSearchParams.toString() ? `/signin?${newSearchParams.toString()}` : '/signin'
        router.replace(newUrl)
      } else if (error === 'CredentialsSignin') {
        toast.error(t('invalidCredentials'), {
          duration: 4000,
          position: 'top-center'
        })
        const newSearchParams = new URLSearchParams(searchParams.toString())
        newSearchParams.delete('error')
        const newUrl = newSearchParams.toString() ? `/signin?${newSearchParams.toString()}` : '/signin'
        router.replace(newUrl)
      } else if (error === 'Callback' || error === 'Default') {
        // These are generic NextAuth errors
        toast.error(t('signInFailedSignUp'), {
          duration: 4000,
          position: 'top-center'
        })

        // Clear the error parameter from URL
        const newSearchParams = new URLSearchParams(searchParams.toString())
        newSearchParams.delete('error')
        const newUrl = newSearchParams.toString() ? `/signin?${newSearchParams.toString()}` : '/signin'
        router.replace(newUrl)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [searchParams, router])

  // 세션이 있으면 온보딩 상태 확인 후 리다이렉트
  useEffect(() => {
    // Only redirect if authenticated AND not already redirecting
    if (status === 'authenticated' && session?.user?.id) {
      // Prevent multiple redirects
      const isRedirecting = sessionStorage.getItem('redirecting')
      if (isRedirecting) return

      sessionStorage.setItem('redirecting', 'true')

      const handleRedirect = async () => {
        try {
          const onboardingStatus = await checkOnboardingStatus(session.user.id)

          if (onboardingStatus) {
            console.log('👤 User needs onboarding')
            // Use router.push instead of window.location.href for better control
            router.push('/onboarding?type=user')
          } else {
            console.log('✅ Redirecting to:', callbackUrl)
            // Use router.push for consistent behavior
            router.push(callbackUrl)
          }
        } catch (error) {
          console.error('❌ Error checking onboarding:', error)
          router.push(callbackUrl)
        } finally {
          // Clear the redirecting flag after a delay
          setTimeout(() => {
            sessionStorage.removeItem('redirecting')
          }, 1000)
        }
      }

      handleRedirect()
    }
  }, [session, status, callbackUrl, router])

  // 로딩 상태 표시를 위한 상태
  const [isLoading, setIsLoading] = useState(true)

  // 페이지 로딩 후 로딩 상태 해제
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  // Farcaster authentication handlers
  const handleFarcasterStatus = useCallback(async (status?: StatusAPIResponse) => {
    if (!status) return;
    const { state, fid, username } = status;
    if (!fid) return;

    if (state && state !== 'completed') {
      return;
    }

    if (hasProcessedSignInRef.current && lastProcessedFidRef.current === fid) {
      return;
    }

    hasProcessedSignInRef.current = true;
    lastProcessedFidRef.current = fid;

    try {
      // Create user account with Farcaster credentials
      const response = await fetch('/api/farcaster/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, username, isSignIn: true }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to authenticate with Farcaster');
        throw new Error(errorText);
      }

      const data = await response.json();

      // Sign in with NextAuth using the created/existing user
      if (data.user) {
        await signIn('credentials', {
          email: data.user.email,
          password: 'farcaster_auth', // Special password for Farcaster users
          isFarcaster: 'true',
          fid: String(fid),
          redirect: true,
          callbackUrl,
        });
      }
    } catch (error) {
      console.error('[SignIn] Farcaster authentication failed:', error);
      toast.error(t('farcasterSignInError') || 'Farcaster authentication failed');
    } finally {
      setIsFarcasterModalOpen(false);
    }
  }, [callbackUrl, t]);

  const handleFarcasterError = useCallback((error?: Error) => {
    console.error('[SignIn] Farcaster error:', error);
    toast.error(t('farcasterSignInError') || 'Farcaster authentication failed');
    setIsFarcasterModalOpen(false);
  }, [t]);

  const {
    connect: connectFarcaster,
    signIn: signInFarcaster,
    reconnect: reconnectFarcaster,
    isError: isFarcasterError,
    url: farcasterUrl,
    isPolling: isFarcasterPolling,
  } = useSignIn({
    onSuccess: handleFarcasterStatus,
    onStatusResponse: handleFarcasterStatus,
    onError: handleFarcasterError,
  });

  const handleFarcasterSignIn = useCallback(async () => {
    try {
      hasProcessedSignInRef.current = false;
      lastProcessedFidRef.current = null;
      setIsFarcasterModalOpen(true);

      if (isFarcasterError) {
        reconnectFarcaster();
      }

      await connectFarcaster();
      signInFarcaster();
    } catch (error) {
      console.error('[SignIn] Farcaster connect failed:', error);
      toast.error(t('farcasterSignInError') || 'Farcaster authentication failed');
      setIsFarcasterModalOpen(false);
    }
  }, [connectFarcaster, isFarcasterError, reconnectFarcaster, signInFarcaster, t]);

  // 폼 제출 핸들러
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  // Email 로그인 핸들러
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error(t('signInError'))
      return
    }
    try {
      setIsSubmitting(true)
      await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl,
      })
      // next-auth가 redirect를 처리하므로 추가 액션 불필요
    } catch (err) {
      toast.error(t('signInError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Google 로그인 핸들러
  const handleGoogleSignIn = async () => {
    console.log('🔐 Starting sign in flow')
    await signIn('google', {
      callbackUrl,
      redirect: true
    })
  }

  // 로딩 중이면 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/40 flex items-center justify-center">
        <div className="text-white">
          <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    )
  }

  // 이미 인증되었으면 렌더링 안함 (리다이렉션 처리 중)
  if (status === 'authenticated') {
    return null
  }

  // Web3 모드에서는 Farcaster 전용 디자인 사용
  if (featureFlags.showOnlyFarcasterAuth()) {
    return (
      <div className="relative h-screen w-full">
        {/* 배경 대시보드 */}
        <div className="fixed inset-0 w-full h-full bg-dashboard-preview bg-cover bg-center opacity-75 dark:opacity-50"></div>

        {/* 블러 처리 오버레이 */}
        <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center">
          {/* Farcaster 전용 로그인 모달 */}
          <div className="w-full m-4 max-w-md space-y-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-background/95 shadow-2xl p-8">
            <button
              onClick={handleGoBack}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              aria-label={t('close')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>

            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <img src="/farcaster-logo.svg" alt="Farcaster" className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Farcaster로 로그인
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('farcasterSignInDescription') || 'Farcaster 계정으로 로그인하세요'}
              </p>
            </div>

            <div className="space-y-6">
              {isFarcasterModalOpen && farcasterUrl ? (
                // QR 코드 표시 상태
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                    <QRCode uri={farcasterUrl} size={200} />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Warpcast로 QR 코드를 스캔하세요
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('scanQRCode') || 'Warpcast 앱에서 이 QR 코드를 스캔하여 로그인하세요'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFarcasterModalOpen(false)}
                    className="mt-4"
                  >
                    {t('cancel') || '취소'}
                  </Button>
                </div>
              ) : (
                // 로그인 버튼 상태
                <div className="space-y-4">
                  <Button
                    onClick={handleFarcasterSignIn}
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isFarcasterPolling}
                  >
                    {isFarcasterPolling ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('connecting') || '연결 중...'}
                      </>
                    ) : (
                      <>
                        <img src="/farcaster-logo.svg" alt="Farcaster" className="w-5 h-5 mr-2" />
                        {t('signInWithFarcaster') || 'Farcaster로 로그인'}
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Warpcast 앱이 필요합니다
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center text-xs text-gray-500">
                {t('privacyNotice')} <a href="/privacy" className="text-primary hover:underline" target="_blank">{t('privacyPolicy')}</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 일반 모드에서는 기존 디자인 사용
  return (
    <div className="relative h-screen w-full">
      {/* 배경 대시보드 */}
      <div className="fixed inset-0 w-full h-full bg-dashboard-preview bg-cover bg-center opacity-75 dark:opacity-50"></div>

      {/* 블러 처리 오버레이 */}
      <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center">
        {/* 로그인 모달 */}
        <div className="w-full m-4 max-w-md space-y-6  rounded-2xl border border-gray-200 dark:border-gray-800 bg-background/95 shadow-2xl p-8">
          <button
            onClick={handleGoBack}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            aria-label={t('close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('welcome')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('signInDescription')}
            </p>
          </div>

          <div className="space-y-4">
            {/* 이메일 로그인 */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <Input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="outline" size="lg" className="w-full" disabled={isSubmitting}>
                {t('signInWithEmail')}
              </Button>
            </form>

            {/* 구분선 */}
            <div className="flex gap-3 items-center justify-center">
              <div className="w-full h-px bg-gray-200" />
              <span className="text-gray-500 text-xs">or</span>
              <div className="w-full h-px bg-gray-200" />
            </div>

            <SocialButton
              social="google"
              theme="brand"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              {t('signInWithGoogle')}
            </SocialButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-sm text-primary hover:underline"
              >
                {t('noAccount')}
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              {t('privacyNotice')} <a href="/privacy" className="text-primary hover:underline" target="_blank">{t('privacyPolicy')}</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}