'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect, useState } from 'react'
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
  const [queryClient] = useState(() => new QueryClient());

  // Notify Base Mini App environment that the app is ready
  useEffect(() => {
    let cancelled = false;
    const maxAttempts = 5;

    const notifyReady = async (attempt = 1) => {
      try {
        const inMiniApp = await sdk.isInMiniApp(5000);
        if (!inMiniApp) {
          if (!cancelled && attempt < maxAttempts) {
            setTimeout(() => notifyReady(attempt + 1), 1000);
          }
          return;
        }

        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to notify Base mini app host about readiness', error);
        if (!cancelled && attempt < maxAttempts) {
          setTimeout(() => notifyReady(attempt + 1), 1000);
        }
      }
    };

    notifyReady();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}
