'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useMemo } from 'react'
import { Session } from 'next-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthKitProvider } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'

interface ProvidersProps {
  children: ReactNode
  session?: Session | null
}

export function Providers({
  children,
  session
}: ProvidersProps) {
  const queryClient = new QueryClient();

  const { rpcUrl, domain, siweUri } = useMemo(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    let host = '';
    try {
      host = appUrl ? new URL(appUrl).hostname : 'localhost';
    } catch {
      host = 'localhost';
    }
    return {
      rpcUrl: process.env.NEXT_PUBLIC_FARCASTER_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      domain: process.env.NEXT_PUBLIC_DOMAIN || host,
      siweUri: process.env.NEXT_PUBLIC_FARCASTER_SIWE_URI || (appUrl ? `${appUrl}/login` : 'http://localhost:3000/login'),
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <AuthKitProvider config={{ rpcUrl, domain, siweUri }}>
          {children}
        </AuthKitProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}