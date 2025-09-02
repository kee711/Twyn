'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { checkOnboardingStatus } from '@/lib/utils/check-onboarding'
import { SocialButton } from '@/components/signin/buttons/social-button'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SignInClient() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/contents/topic-finder'
  const { data: session, status } = useSession()
  const [isSignUp, setIsSignUp] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteCodeError, setInviteCodeError] = useState('')
  const [isCodeValid, setIsCodeValid] = useState(false)

  // Check for error messages in URL
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'NotRegistered') {
      toast.error('계정이 존재하지 않습니다. 먼저 회원가입을 진행해주세요.')
      // Automatically switch to signup mode
      setIsSignUp(true)
    } else if (error === 'InvalidInviteCode') {
      toast.error('유효하지 않은 초대 코드입니다.')
    } else if (error === 'CreateUserFailed') {
      toast.error('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }, [searchParams])

  // 세션이 있으면 온보딩 상태 확인 후 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const handleRedirect = async () => {
        try {
          const onboardingStatus = await checkOnboardingStatus(session.user.id)

          // 온보딩이 필요한 사용자는 온보딩 페이지로
          if (onboardingStatus) {
            console.log('👤 User onboarding needed, redirecting to user onboarding');
            window.location.href = '/onboarding?type=user'
          } else {
            // 온보딩이 완료된 사용자는 바로 callbackUrl로 이동
            console.log('✅ User onboarding complete, redirecting to:', callbackUrl);
            window.location.href = callbackUrl
          }
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error)
          // Fallback to default redirect
          window.location.href = callbackUrl
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

  // 초대 코드 검증
  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setInviteCodeError('초대 코드를 입력해주세요')
      setIsCodeValid(false)
      return
    }

    setInviteCodeError('')

    try {
      const response = await fetch('/api/auth/validate-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      const data = await response.json()

      if (data.success) {
        setIsCodeValid(true)
        setInviteCodeError('')
        // Store invite code in session storage for auth callback
        sessionStorage.setItem('inviteCodeId', data.inviteCodeId)
        sessionStorage.setItem('inviteCode', code)
      } else {
        setIsCodeValid(false)
        setInviteCodeError(data.error || '유효하지 않은 초대 코드입니다')
      }
    } catch (error) {
      setIsCodeValid(false)
      setInviteCodeError('초대 코드 확인 중 오류가 발생했습니다')
    }
  }

  // 초대 코드 입력 변경 처리
  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setInviteCode(code)

    if (code.length > 0) {
      // 즉시 검증 실행
      validateInviteCode(code)
    } else {
      setIsCodeValid(false)
      setInviteCodeError('')
    }
  }

  // Google 로그인 핸들러
  const handleGoogleSignIn = async () => {
    if (isSignUp) {
      // 회원가입 모드에서는 초대 코드가 유효한 경우에만 진행
      if (isCodeValid) {
        // Store signup info for the auth callback
        sessionStorage.setItem('isSignup', 'true')
        sessionStorage.setItem('inviteCode', inviteCode)
        sessionStorage.setItem('inviteCodeId', sessionStorage.getItem('inviteCodeId') || '')
        
        // Proceed with Google OAuth
        signIn('google', { callbackUrl })
      }
    } else {
      // 로그인 모드 - Sign in with Google
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl 
      })
      
      // Check if sign in was blocked (user doesn't exist)
      if (result?.error) {
        toast.error('Please sign up first')
        setIsSignUp(true) // Switch to signup mode
      } else if (result?.url) {
        window.location.href = result.url
      }
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
              {isSignUp ? '회원가입' : t('welcome')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isSignUp ? '초대 코드를 입력하여 시작하세요' : t('signInDescription')}
            </p>
          </div>

          <div className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="초대 코드 입력"
                  value={inviteCode}
                  onChange={handleInviteCodeChange}
                  className={`w-full pr-32 ${inviteCodeError ? 'border-red-500' : isCodeValid ? 'border-green-500' : ''}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {inviteCodeError && (
                    <>
                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-xs text-red-500">Invalid code</span>
                    </>
                  )}
                  {isCodeValid && (
                    <>
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </>
                  )}
                </div>
              </div>
            )}

            <SocialButton
              social="google"
              theme="brand"
              className={`w-full ${isSignUp && !isCodeValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleGoogleSignIn}
              disabled={isSignUp && !isCodeValid}
            >
              {isSignUp ? 'Google로 회원가입' : t('signInWithGoogle')}
            </SocialButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setInviteCode('')
                  setInviteCodeError('')
                  setIsCodeValid(false)
                }}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
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