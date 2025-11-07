'use client'

import { useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function AutoLogout() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        const handleAutoLogout = async () => {
            // Check if auto logout has already been performed
            const hasAutoLoggedOut = sessionStorage.getItem('auto_logged_out')

            if (status === 'authenticated' && !hasAutoLoggedOut) {
                console.log('[AutoLogout] Performing automatic logout...')

                // Mark as logged out
                sessionStorage.setItem('auto_logged_out', 'true')

                // Clear all storage
                localStorage.clear()

                // Sign out
                await signOut({ redirect: false })

                // Redirect to signin
                router.push('/signin')
            } else if (status === 'unauthenticated') {
                // If already logged out, just redirect to signin
                router.push('/signin')
            }
        }

        handleAutoLogout()
    }, [status, router])

    return (
        <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/40 flex items-center justify-center">
            <div className="text-white text-center space-y-4">
                <svg className="animate-spin h-8 w-8 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm">로그아웃 중...</p>
            </div>
        </div>
    )
}
