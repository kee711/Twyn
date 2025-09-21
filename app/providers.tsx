'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import { Session } from 'next-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sdk } from '@farcaster/miniapp-sdk'

interface ProvidersProps {
  children: ReactNode
  session?: Session | null
}

export function Providers({
  children,
  session
}: ProvidersProps) {
  const queryClient = new QueryClient();

  // Notify Base Mini App environment that the app is ready
  useEffect(() => {
    sdk.actions.ready().catch(() => { });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}