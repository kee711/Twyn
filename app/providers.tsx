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

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
      });

    const notifyReady = async () => {
      let attempt = 0;

      while (!cancelled) {
        try {
          const inMiniApp = await sdk.isInMiniApp(2000);
          if (!inMiniApp) {
            attempt += 1;
            if (attempt % 5 === 0) {
              console.warn('Base mini app: still waiting for host context');
            }

            if (attempt >= 10) {
              try {
                await sdk.actions.ready();
                break;
              } catch (readyError) {
                console.warn('Base mini app: force-ready attempt failed', readyError);
              }
            }

            await wait(Math.min(1000 * attempt, 5000));
            continue;
          }

          await sdk.actions.ready();
          break;
        } catch (error) {
          console.error('Failed to notify Base mini app host about readiness', error);
          attempt += 1;
          if (attempt % 5 === 0) {
            console.warn('Base mini app: retrying ready handshake');
          }
          await wait(Math.min(1000 * attempt, 5000));
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
