'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { SocialButton } from '@/components/signin/buttons/social-button'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

export default function SignUpClient() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { data: session, status } = useSession()
  const [inviteCode, setInviteCode] = useState('')
  const [inviteCodeError, setInviteCodeError] = useState('')
  const [isCodeValid, setIsCodeValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 이미 로그인된 경우 리다이렉트 (signup 진행 중이 아닌 경우만)
  useEffect(() => {
    // signup 프로세스 중인지 확인
    const isSignupProcess = sessionStorage.getItem('signup_in_progress') === 'true'
    
    if (status === 'authenticated' && session?.user && !isSignupProcess) {
      router.push('/contents/topic-finder')
    }
  }, [session, status, router])
  
  // Check for error messages in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')
    
    // Handle errors from signup attempts
    if (error === 'AccessDenied' || error === 'OAuthAccountNotLinked') {
      // Check if we came from a signup attempt (signup_intent cookie would be set)
      const isFromSignup = sessionStorage.getItem('signup_in_progress') === 'true'
      
      if (isFromSignup) {
        // This means user already exists
        toast.error('이미 가입된 계정입니다. 로그인 페이지로 이동합니다.', {
          duration: 3000,
          position: 'top-center'
        })
        sessionStorage.removeItem('signup_in_progress')
      } else {
        toast.error('회원가입 중 오류가 발생했습니다.', {
          duration: 3000,
          position: 'top-center'
        })
      }
      
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    } else if (error === 'UserAlreadyExists') {
      toast.error('이미 가입된 계정입니다. 로그인 페이지로 이동합니다.', {
        duration: 3000,
        position: 'top-center'
      })
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    }
  }, [router])

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
      validateInviteCode(code)
    } else {
      setIsCodeValid(false)
      setInviteCodeError('')
    }
  }

  // Google 회원가입 핸들러
  const handleGoogleSignUp = async () => {
    if (!isCodeValid) {
      toast.error('유효한 초대 코드를 입력해주세요')
      return
    }

    setIsLoading(true)
    
    try {
      // Mark signup process as in progress
      sessionStorage.setItem('signup_in_progress', 'true')
      
      // 1. 먼저 signup 준비 API를 호출하여 서버에 signup 의도를 알림
      const prepResponse = await fetch('/api/auth/prepare-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode,
          inviteCodeId: sessionStorage.getItem('inviteCodeId')
        })
      })

      const prepData = await prepResponse.json()

      if (!prepData.success) {
        toast.error(prepData.error || '회원가입 준비 중 오류가 발생했습니다')
        sessionStorage.removeItem('signup_in_progress')
        setIsLoading(false)
        return
      }

      // 2. Google OAuth로 진행 (signup 모드)
      // 쿠키가 설정되어 있으므로 일반 signIn 사용
      // 온보딩 페이지로 리다이렉트
      await signIn('google', {
        callbackUrl: '/onboarding?type=user'
      })
      
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('회원가입 중 오류가 발생했습니다')
      sessionStorage.removeItem('signup_in_progress')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative h-screen w-full">
      <div className="fixed inset-0 w-full h-full bg-dashboard-preview bg-cover bg-center opacity-75 dark:opacity-50"></div>
      
      <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center">
        <div className="w-full m-4 max-w-md space-y-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-background/95 shadow-2xl p-8">
          <button
            onClick={() => router.push('/signin')}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              회원가입
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              초대 코드를 입력하여 시작하세요
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="초대 코드 입력"
                value={inviteCode}
                onChange={handleInviteCodeChange}
                className={`w-full pr-32 ${inviteCodeError ? 'border-red-500' : isCodeValid ? 'border-green-500' : ''}`}
                disabled={isLoading}
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
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )}
              </div>
            </div>

            <SocialButton
              social="google"
              theme="brand"
              className={`w-full ${!isCodeValid || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleGoogleSignUp}
              disabled={!isCodeValid || isLoading}
            >
              {isLoading ? '처리 중...' : 'Google로 회원가입'}
            </SocialButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/signin')}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                이미 계정이 있으신가요? 로그인
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