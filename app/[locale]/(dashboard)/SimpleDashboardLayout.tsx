'use client'

import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/Sidebar'
import { MobileMenuButton } from '@/components/MobileMenuButton'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SimpleDashboardLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession()

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/30">
                <div className="flex flex-col items-center gap-3 rounded-2xl border bg-background px-6 py-8 shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading dashboard…</p>
                </div>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
                <div className="w-full max-w-md space-y-4 rounded-2xl border bg-background p-8 text-center shadow-xl">
                    <h2 className="text-2xl font-semibold text-foreground">Sign in required</h2>
                    <p className="text-sm text-muted-foreground">
                        Please sign in to access your dashboard and continue planning content.
                    </p>
                    <Button size="lg" onClick={() => (window.location.href = '/signin')}>
                        Go to Sign In
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-muted/30">
            <Sidebar className="border-r border-border bg-background" />

            <div className="flex min-h-screen flex-1 flex-col">
                <MobileMenuButton />
                <div className="flex-1 overflow-hidden p-3 md:p-6">
                    <DashboardContent>
                        <div className="h-full">{children}</div>
                    </DashboardContent>
                </div>
            </div>
        </div>
    )
}
