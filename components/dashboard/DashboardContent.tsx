'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
import { SocialConnectRequired } from './SocialConnectRequired'

interface DashboardContentProps {
    children: React.ReactNode
}

export function DashboardContent({ children }: DashboardContentProps) {
    const { data: session } = useSession()
    const { accounts, fetchSocialAccounts } = useSocialAccountStore()
    const [isLoading, setIsLoading] = useState(true)
    const pathname = usePathname()

    useEffect(() => {
        const loadAccounts = async () => {
            if (session?.user?.id) {
                await fetchSocialAccounts(session.user.id)
                setIsLoading(false)
            }
        }
        loadAccounts()
    }, [session?.user?.id, fetchSocialAccounts])

    // Check if current path is settings page
    const isSettingsPage = pathname?.includes('/settings')

    if (isLoading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>
    }

    // Skip social account requirement for settings page
    if (!isSettingsPage && accounts.length === 0) {
        return <SocialConnectRequired />
    }

    return <>{children}</>
}