'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { Session } from 'next-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext'

interface ProvidersProps {
  children: ReactNode
  session?: Session | null
}

export function Providers({
  children,
  session
}: ProvidersProps) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <MobileSidebarProvider>
          {children}
        </MobileSidebarProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}