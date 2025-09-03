import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
          scope: "openid email profile",
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
          .maybeSingle()

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
          .maybeSingle()

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

        // Check if this is a signup flow by checking cookies
        const cookieStore = await cookies()
        const isSignupIntent = cookieStore.get('signup_intent')?.value === 'true'
        const inviteCode = cookieStore.get('signup_invite_code')?.value
        const inviteCodeId = cookieStore.get('signup_invite_code_id')?.value


        // 사용자가 존재하는지 확인
        const { data: existingUser, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError)
          return false
        }

        // 사용자가 존재하지 않는 경우
        if (!existingUser) {
          // signup 모드인 경우에만 사용자 생성
          if (isSignupIntent) {

            // Handle invite code if provided - MUST complete before user creation
            if (inviteCode && inviteCodeId) {
              // First, get the current used_count
              const { data: inviteData, error: fetchError } = await supabase
                .from('invite_codes')
                .select('used_count')
                .eq('code', inviteCode)
                .single()

              if (fetchError) {
                console.error('Error fetching invite code:', fetchError)
                return false // Fail the signup if we can't verify the invite code
              }

              // Increment used_count
              const newUsedCount = (inviteData?.used_count || 0) + 1

              const { error: updateError } = await supabase
                .from('invite_codes')
                .update({
                  used_count: newUsedCount,
                })
                .eq('code', inviteCode)

              if (updateError) {
                console.error('Error updating invite code used_count:', updateError)
                return false // Fail the signup if we can't update the invite code
              }

              console.log(`✅ Successfully incremented used_count for invite code: ${inviteCode} to ${newUsedCount}`)
            }

            // Create new user with invite_code_id if provided
            const userProfileData: any = {
              email: user.email,
              name: user.name,
              image: user.image,
              user_id: user.id,
              provider: account?.provider,
              created_at: new Date().toISOString()
            }
            
            // Add invite_code_id if an invite code was used
            if (inviteCodeId) {
              userProfileData.invite_code_id = inviteCodeId
            }
            
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert(userProfileData)

            if (createError) {
              console.error('Error creating user:', createError)
              return false
            }


            // Note: We can't clear cookies here directly, but they will be cleared
            // when the user lands on the onboarding page
            return true
          }

          // Not signup mode - block sign in
          return false
        }

        // 삭제된 계정인 경우
        if (existingUser.deleted_at) {
          // signup 모드이면 계정 복구
          if (isSignupIntent) {
            // Handle invite code if provided - MUST complete before account restoration
            if (inviteCode && inviteCodeId) {
              // First, get the current used_count
              const { data: inviteData, error: fetchError } = await supabase
                .from('invite_codes')
                .select('used_count')
                .eq('code', inviteCode)
                .single()

              if (fetchError) {
                console.error('Error fetching invite code:', fetchError)
                return false // Fail the signup if we can't verify the invite code
              }

              // Increment used_count
              const newUsedCount = (inviteData?.used_count || 0) + 1

              const { error: updateError } = await supabase
                .from('invite_codes')
                .update({
                  used_count: newUsedCount,
                })
                .eq('code', inviteCode)

              if (updateError) {
                console.error('Error updating invite code used_count:', updateError)
                return false // Fail the signup if we can't update the invite code
              }

              console.log(`✅ Successfully incremented used_count for invite code: ${inviteCode} to ${newUsedCount} (account restoration)`)
            }

            // Prepare update data with invite_code_id if provided
            const updateData: any = {
              deleted_at: null,
              name: user.name,
              provider: account?.provider,
              image: user.image,
              user_id: user.id,
              updated_at: new Date().toISOString()
            }
            
            // Add invite_code_id if an invite code was used
            if (inviteCodeId) {
              updateData.invite_code_id = inviteCodeId
            }
            
            const { error: restoreError } = await supabase
              .from('user_profiles')
              .update(updateData)
              .eq('email', user.email)

            if (restoreError) {
              console.error('Error restoring user:', restoreError)
              return false
            }

            return true
          }

          return false
        }

        // 기존 사용자 - 로그인 모드
        if (!isSignupIntent) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              name: user.name,
              provider: account?.provider,
              image: user.image,
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('email', user.email)

          if (updateError) {
            console.error('Error updating user:', updateError)
            return false
          }

          return true
        } else {
          // signup 모드인데 이미 사용자가 존재하는 경우
          console.log('⚠️ User already exists in signup mode:', user.email)
          // Return false will redirect to error page
          // The error will be handled based on the signup_intent cookie
          return false
        }
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
    error: '/signin', // Default error redirect
  },
}