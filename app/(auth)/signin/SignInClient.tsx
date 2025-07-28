'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { checkOnboardingStatus } from '@/lib/utils/check-onboarding'
import { SocialButton } from '@/components/signin/buttons/social-button'

export default function SignInClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/contents/topic-finder'
  const { data: session, status } = useSession()

  // 세션이 있으면 온보딩 상태 확인 후 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const handleRedirect = async () => {
        try {
          const onboardingStatus = await checkOnboardingStatus(session.user.id)

          // 온보딩이 완료된 사용자는 바로 callbackUrl로 이동
          if (!onboardingStatus) {
            console.log('✅ User onboarding complete, redirecting to:', callbackUrl);
            router.push(callbackUrl)
          } else if (onboardingStatus) {
            console.log('👤 User onboarding needed, redirecting to user onboarding');
            router.push('/onboarding?type=user')
          } else {
            console.log('🔄 Fallback case, redirecting to:', callbackUrl);
            // Fallback - 온보딩 상태가 명확하지 않은 경우 기본 페이지로
            router.push(callbackUrl)
          }
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error)
          // Fallback to default redirect
          router.push(callbackUrl)
        }
      }

      handleRedirect()
    }
  }, [session, status, router, callbackUrl])

  // 로딩 상태 표시를 위한 상태
  const [isLoading, setIsLoading] = useState(true)

  // 페이지 로딩 후 로딩 상태 해제
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  // 폼 제출 핸들러
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
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

  return (
    <div className="relative h-screen w-full">
      {/* 배경 대시보드 */}
      <div className="fixed inset-0 w-full h-full bg-dashboard-preview bg-cover bg-center opacity-75 dark:opacity-50"></div>

      {/* 블러 처리 오버레이 */}
      <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center">
        {/* 로그인 모달 */}
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-background/95 shadow-2xl p-8">
          <button
            onClick={handleGoBack}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Twyn!</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sign in to your account to continue
            </p>
          </div>

          <div className="space-y-4">
            <SocialButton
              social="google"
              theme="brand"
              className="w-full"
              onClick={() => signIn('google', { callbackUrl })}
            >
              Sign in with Google
            </SocialButton>

            <div className="text-center text-xs text-gray-500">
              By continuing, you agree to our <a href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}