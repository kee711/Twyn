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
import { useAccount, useConnect } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity'
import { base } from 'wagmi/chains'
import { useBaseAccount } from '@/hooks/useBaseAccount'

export default function SignInClient() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/contents/topic-finder'
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Base Account and Farcaster authentication state
  const [isFarcasterModalOpen, setIsFarcasterModalOpen] = useState(false)
  const [isConnectingBase, setIsConnectingBase] = useState(false)
  const hasProcessedSignInRef = useRef(false)
  const lastProcessedFidRef = useRef<number | null>(null)
  const hasProcessedBaseAccountRef = useRef(false)
  const lastProcessedAddressRef = useRef<string | null>(null)

  // Base Account integration - Wagmi hooks
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  // Get Coinbase Wallet connector
  const coinbaseConnector = connectors.find(
    (connector) => connector.id === 'coinbaseWalletSDK'
  )

  // Base Account hook for mini app environment
  const {
    account: baseAccount,
    isConnected: isBaseConnected,
    isLoading: isBaseLoading,
    connect: connectBase,
    error: baseError
  } = useBaseAccount()

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

  // Base Account 인증 처리
  const handleBaseAccountAuth = useCallback(async (walletAddress: string) => {
    try {
      setIsConnectingBase(true);
      console.log('[SignIn] Starting Base Account authentication for:', walletAddress);
      console.log('[SignIn] Callback URL:', callbackUrl);

      // Base Account로 사용자 생성/인증
      const response = await fetch('/api/base/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          isSignIn: true
        }),
      });

      console.log('[SignIn] Base Account API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SignIn] Base Account API error:', errorText);
        throw new Error(`Failed to authenticate with Base Account: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[SignIn] Base Account API success:', data);

      // NextAuth로 로그인
      if (data.user) {
        console.log('[SignIn] Proceeding with NextAuth login for user:', data.user.id);
        console.log('[SignIn] NextAuth credentials:', {
          email: data.user.email,
          isBaseAccount: 'true',
          address: walletAddress,
          callbackUrl,
        });

        const result = await signIn('credentials', {
          email: data.user.email,
          password: 'base_account_auth',
          isBaseAccount: 'true',
          address: walletAddress,
          redirect: false, // Don't redirect automatically to see the result
          callbackUrl,
        });

        console.log('[SignIn] NextAuth signIn result:', result);

        if (result?.error) {
          console.error('[SignIn] NextAuth error:', result.error);
          throw new Error(`NextAuth error: ${result.error}`);
        }

        if (result?.ok) {
          console.log('[SignIn] NextAuth login successful, redirecting to:', result.url || callbackUrl);
          window.location.href = result.url || callbackUrl;
        } else {
          throw new Error('NextAuth login failed without error message');
        }
      } else {
        throw new Error('No user data returned from Base Account API');
      }
    } catch (error) {
      console.error('[SignIn] Base Account auth failed:', error);

      // Reset the processed flag to allow retry
      hasProcessedBaseAccountRef.current = false;
      lastProcessedAddressRef.current = null;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Base Account authentication failed: ${errorMessage}`, {
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => {
            if (walletAddress) {
              handleBaseAccountAuth(walletAddress);
            }
          }
        }
      });
    } finally {
      setIsConnectingBase(false);
    }
  }, [callbackUrl]);

  // Base Account 자동 감지 및 로그인
  useEffect(() => {
    // Prevent multiple login attempts
    if (isConnectingBase || session) {
      return;
    }

    // Check for Base Account from mini app SDK
    if (isBaseConnected && baseAccount && featureFlags.showOnlyFarcasterAuth()) {
      // Prevent duplicate processing
      if (hasProcessedBaseAccountRef.current && lastProcessedAddressRef.current === baseAccount) {
        console.log('[SignIn] Base Account already processed:', baseAccount);
        return;
      }

      console.log('[SignIn] Base Account detected from mini app:', baseAccount);
      hasProcessedBaseAccountRef.current = true;
      lastProcessedAddressRef.current = baseAccount;
      handleBaseAccountAuth(baseAccount);
    }
    // Check for Wagmi wallet connection
    else if (isConnected && address && featureFlags.showOnlyFarcasterAuth()) {
      // Prevent duplicate processing
      if (hasProcessedBaseAccountRef.current && lastProcessedAddressRef.current === address) {
        console.log('[SignIn] Wallet address already processed:', address);
        return;
      }

      console.log('[SignIn] Wallet connected:', address);
      hasProcessedBaseAccountRef.current = true;
      lastProcessedAddressRef.current = address;
      handleBaseAccountAuth(address);
    }
  }, [isBaseConnected, baseAccount, isConnected, address, session, isConnectingBase, handleBaseAccountAuth]);

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

  // Farcaster 로그인 핸들러 (먼저 정의)
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

  // Base Account 연결 핸들러
  const handleBaseAccountConnect = useCallback(async () => {
    try {
      setIsConnectingBase(true);

      // First try mini app SDK connection
      if (typeof window !== 'undefined') {
        try {
          await connectBase();
          return; // If successful, the useEffect will handle authentication
        } catch (miniAppError) {
          console.log('[SignIn] Mini app connection failed, trying wallet connection:', miniAppError);
        }
      }

      // Fallback to Coinbase Wallet connection
      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
      } else {
        // If no Coinbase Wallet, fallback to Farcaster
        toast.info('Coinbase Wallet not found. Using Farcaster login instead.');
        handleFarcasterSignIn();
      }

    } catch (error) {
      console.error('[SignIn] Base Account connect failed:', error);
      toast.error('Failed to connect Base Account');
      setIsConnectingBase(false);
    }
  }, [coinbaseConnector, connect, connectBase, handleFarcasterSignIn]);

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

  // Debug: Web3 mode check
  console.log('[SignIn Debug] Environment variables:', {
    NEXT_PUBLIC_WEB3_MODE: process.env.NEXT_PUBLIC_WEB3_MODE,
    showOnlyFarcasterAuth: featureFlags.showOnlyFarcasterAuth(),
  });

  // Web3 모드에서는 Farcaster 전용 디자인 사용
  if (featureFlags.showOnlyFarcasterAuth()) {
    return (
      <div className="relative h-screen w-full">
        {/* 배경 대시보드 */}
        <div className="fixed inset-0 w-full h-full bg-dashboard-preview bg-cover bg-center opacity-75 dark:opacity-50"></div>

        {/* 블러 처리 오버레이 */}
        <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center">
          {/* Base App 전용 로그인 모달 */}
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
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Twyn</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Base App으로 로그인
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Base Account가 자동으로 감지되면 로그인됩니다
              </p>
            </div>

            <div className="space-y-6">
              {(isConnected && address) || (isBaseConnected && baseAccount) ? (
                // Base Account 연결됨 상태
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Base Account 연결됨
                    </p>
                    <div className="text-xs text-gray-500 font-mono">
                      {address || baseAccount || ''}
                    </div>
                    <p className="text-xs text-gray-500">
                      {isConnectingBase ? '로그인 중...' : '자동으로 로그인됩니다'}
                    </p>
                  </div>
                </div>
              ) : (
                // Base Account 연결 버튼 상태
                <div className="space-y-4">
                  <Button
                    onClick={handleBaseAccountConnect}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isConnectingBase}
                  >
                    {isConnectingBase ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        연결 중...
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 bg-white rounded mr-2 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">B</span>
                        </div>
                        Base Account로 로그인
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Base Account가 자동으로 감지되어 로그인됩니다
                    </p>
                  </div>

                  {/* Fallback Farcaster 로그인 */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">또는</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleFarcasterSignIn}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={isFarcasterPolling}
                  >
                    {isFarcasterPolling ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        연결 중...
                      </>
                    ) : (
                      <>
                        <img src="/farcaster-logo.svg" alt="Farcaster" className="w-5 h-5 mr-2" />
                        Farcaster로 로그인
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Farcaster QR 코드 모달 */}
              {isFarcasterModalOpen && farcasterUrl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">Farcaster로 로그인</h3>
                      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                        <QRCode uri={farcasterUrl} size={200} />
                      </div>
                      <p className="text-sm text-gray-600">
                        Warpcast 앱으로 QR 코드를 스캔하세요
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setIsFarcasterModalOpen(false)}
                        className="w-full"
                      >
                        취소
                      </Button>
                    </div>
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