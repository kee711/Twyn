'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { SocialButton } from '@/components/signin/buttons/social-button'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

export default function SignUpClient() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        toast.error(t('alreadyRegistered'), {
          duration: 3000,
          position: 'top-center'
        })
        sessionStorage.removeItem('signup_in_progress')
      } else {
        toast.error(t('signUpError'), {
          duration: 3000,
          position: 'top-center'
        })
      }

      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    } else if (error === 'UserAlreadyExists') {
      toast.error(t('alreadyRegistered'), {
        duration: 3000,
        position: 'top-center'
      })
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    }
  }, [router])

  // // 초대 코드 검증
  // const validateInviteCode = async (code: string) => {
  //   if (!code.trim()) {
  //     setInviteCodeError(t('inviteCodeRequired'))
  //     setIsCodeValid(false)
  //     return
  //   }
  //
  //   setInviteCodeError('')
  //
  //   try {
  //     const response = await fetch('/api/auth/validate-invite-code', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ code })
  //     })
  //
  //     const data = await response.json()
  //
  //     if (data.success) {
  //       setIsCodeValid(true)
  //       setInviteCodeError('')
  //       sessionStorage.setItem('inviteCodeId', data.inviteCodeId)
  //       sessionStorage.setItem('inviteCode', code)
  //     } else {
  //       setIsCodeValid(false)
  //       setInviteCodeError(data.error || t('invalidInviteCode'))
  //     }
  //   } catch (error) {
  //     setIsCodeValid(false)
  //     setInviteCodeError(t('inviteCodeError'))
  //   }
  // }

  // // 초대 코드 입력 변경 처리
  // const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const code = e.target.value
  //   setInviteCode(code)
  //
  //   if (code.length > 0) {
  //     validateInviteCode(code)
  //   } else {
  //     setIsCodeValid(false)
  //     setInviteCodeError('')
  //   }
  // }

  // Google 회원가입 핸들러
  const handleGoogleSignUp = async () => {
    setIsLoading(true)

    try {
      // Mark signup process as in progress
      sessionStorage.setItem('signup_in_progress', 'true')

      // 1. 먼저 signup 준비 API를 호출하여 서버에 signup 의도를 알림
      const prepResponse = await fetch('/api/auth/prepare-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const prepData = await prepResponse.json()

      if (!prepData.success) {
        toast.error(prepData.error || t('signUpPreparationError'))
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
      toast.error(t('signUpError'))
      sessionStorage.removeItem('signup_in_progress')
      setIsLoading(false)
    }
  }

  // 이메일 회원가입 핸들러 (Credentials)
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error(t('signUpError'))
      return
    }

    try {
      setIsSubmitting(true)
      sessionStorage.setItem('signup_in_progress', 'true')

      // 1) 서버에 signup 의도 알림 (쿠키 세팅)
      const prepResponse = await fetch('/api/auth/prepare-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const prepData = await prepResponse.json()
      if (!prepData.success) {
        toast.error(prepData.error || t('signUpPreparationError'))
        sessionStorage.removeItem('signup_in_progress')
        setIsSubmitting(false)
        return
      }

      // 2) Credentials provider로 회원가입 진행
      await signIn('credentials', {
        email,
        password,
        isSignup: 'true',
        callbackUrl: '/onboarding?type=user',
        redirect: true,
      })
    } catch (err) {
      console.error('Email signup error:', err)
      toast.error(t('signUpError'))
    } finally {
      setIsSubmitting(false)
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
              {t('signUp')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('signUpDescription')}
            </p>
          </div>

          <div className="space-y-4">
            {/* <div className="relative">
              <Input
                type="text"
                placeholder={t('inviteCodePlaceholder')}
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
                    <span className="text-xs text-red-500">
                      {inviteCodeError.includes('usage limit') || inviteCodeError.includes('expired') ? t('expiredInviteCode') : t('invalidInviteCode')}
                    </span>
                  </>
                )}
                {isCodeValid && (
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )}
              </div>
            </div> */}

            {/* 이메일 회원가입 */}
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <Input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <Input
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <Button type="submit" variant="outline" size="lg" className="w-full" disabled={isSubmitting}>
                {t('signUpWithEmail')}
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
              className={`w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              {isLoading ? t('processing') : t('signUpWithGoogle')}
            </SocialButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/signin')}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                {t('haveAccount')}
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
