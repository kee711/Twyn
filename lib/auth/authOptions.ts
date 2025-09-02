import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

declare module 'next-auth' {
  interface Session {
    user: {
      id: string  // ✅ id 추가
      email: string
      name?: string | null
      image?: string | null
      provider?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    provider: string
    needsOnboarding?: boolean
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // JWT 세션
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      if (account && profile) {
        token.userId = profile.sub ?? ''
        token.provider = account.provider ?? ''

        // Check onboarding status for new sign-ins
        const { data: onboardingData } = await supabase
          .from('user_onboarding')
          .select('is_completed')
          .eq('user_id', profile.sub)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // User needs onboarding only if no record exists at all
        token.needsOnboarding = !onboardingData
      }

      // Re-check onboarding status on session updates
      if (trigger === 'update' && token.userId) {
        const { data: onboardingData } = await supabase
          .from('user_onboarding')
          .select('is_completed')
          .eq('user_id', token.userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // User needs onboarding only if no record exists at all
        token.needsOnboarding = !onboardingData
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.provider = token.provider as string
      }
      return session
    },
    async signIn({ user, account }) {

      try {
        // 사용자가 존재하는지 확인하고 deleted_at 필드 체크
        const { data: existingUser, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError)
          return false
        }

        // 삭제된 계정인 경우 계정 복구
        if (existingUser?.deleted_at) {
          console.log('Restoring deleted account:', user.email)
          const { error: restoreError } = await supabase
            .from('user_profiles')
            .update({
              deleted_at: null,
              name: user.name,
              provider: account?.provider,
              image: user.image,
              user_id: user.id,
            })
            .eq('email', user.email)

          if (restoreError) {
            console.error('Error restoring user:', restoreError)
            return false
          }
        }

        if (!existingUser) {
          // User doesn't exist - block sign in
          console.log('User not registered, blocking sign in:', user.email)
          return false

        } else {
          // 기존 사용자 정보 업데이트
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              name: user.name,
              provider: account?.provider,
              image: user.image,
              user_id: user.id,
            })
            .eq('email', user.email)

          if (updateError) {
            console.error('Error updating user:', updateError)
            return false
          }
        }

        // 로그인 성공 후 온보딩 완료 여부 확인하여 미완료 시 온보딩 페이지로 리다이렉트
        try {
          const { data: onboardingData, error: onboardingError } = await supabase
            .from('user_onboarding')
            .select('is_completed')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // PGRST116: No rows returned → 온보딩 레코드 없음
          if (onboardingError && onboardingError.code !== 'PGRST116') {
            console.error('Error checking onboarding:', onboardingError)
          }

          // User needs onboarding only if no record exists at all
          const needsOnboarding = !onboardingData

          if (needsOnboarding) {
            // Store onboarding flag in token for redirect after session creation
            // Returning true here ensures session is properly created
            return true
          }
        } catch (onboardingCheckError) {
          console.error('Unexpected error checking onboarding:', onboardingCheckError)
        }

        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
  },
  events: {
    async signOut(message) {
      // Additional cleanup can be performed here if needed
      console.log('User signed out:', message)
    }
  },
  pages: {
    signIn: '/signin',
    error: '/error',
  },
  debug: true,
}