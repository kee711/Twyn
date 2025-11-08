'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to topic-finder as the default dashboard page
        router.replace('/contents/topic-finder')
    }, [router])

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600">Redirecting...</div>
        </div>
    )
}
