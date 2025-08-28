'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
import { SocialConnectRequired } from './SocialConnectRequired'

interface DashboardContentProps {
    children: React.ReactNode
}

export function DashboardContent({ children }: DashboardContentProps) {
    const { data: session } = useSession()
    const { accounts, fetchSocialAccounts } = useSocialAccountStore()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadAccounts = async () => {
            if (session?.user?.id) {
                await fetchSocialAccounts(session.user.id)
                setIsLoading(false)
            }
        }
        loadAccounts()
    }, [session?.user?.id, fetchSocialAccounts])

    if (isLoading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>
    }

    if (accounts.length === 0) {
        return <SocialConnectRequired />
    }

    return <>{children}</>
}