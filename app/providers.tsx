'use client'

import '@farcaster/auth-kit/styles.css'
import '@rainbow-me/rainbowkit/styles.css'

import { AuthKitProvider } from '@farcaster/auth-kit'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'

import { createWalletConfig } from '@/lib/wallet'

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

  const walletConfig = useMemo(() => createWalletConfig(), []);
  const walletWrappedChildren = walletConfig ? (
    <WagmiProvider config={walletConfig}>
      <RainbowKitProvider modalSize="compact">
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  ) : children;

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <AuthKitProvider config={{ rpcUrl, domain, siweUri }}>
          {walletWrappedChildren}
        </AuthKitProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
