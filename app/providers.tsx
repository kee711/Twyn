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
      // 일반 웹 브라우저에서는 미니앱 SDK 호출을 건너뛰기
      const isLikelyMiniApp = typeof window !== 'undefined' && (
        window.location.href.includes('farcaster') ||
        window.location.href.includes('warpcast') ||
        navigator.userAgent.includes('Farcaster') ||
        navigator.userAgent.includes('Warpcast') ||
        process.env.NODE_ENV === 'development' // 개발 환경에서는 테스트
      );

      if (!isLikelyMiniApp) {
        console.log('Base mini app: running in regular web browser, skipping mini app initialization');
        return;
      }

      let attempt = 0;
      const maxAttempts = 3;

      while (!cancelled && attempt < maxAttempts) {
        try {
          const inMiniApp = await sdk.isInMiniApp(1000);
          if (!inMiniApp) {
            attempt += 1;
            if (attempt >= maxAttempts) {
              console.log('Base mini app: not running in mini app environment, skipping ready notification');
              break;
            }
            await wait(500);
            continue;
          }

          await sdk.actions.ready();
          console.log('Base mini app: ready notification sent successfully');
          break;
        } catch (error) {
          console.error('Failed to notify Base mini app host about readiness', error);
          attempt += 1;
          if (attempt >= maxAttempts) {
            console.log('Base mini app: max attempts reached, giving up');
            break;
          }
          await wait(500);
        }
      }
    };

    notifyReady();

    return () => {
      cancelled = true;
    };
  }, []);

  const authKitConfig = useMemo(() => {
    const config: Record<string, string> = {};

    const rpcUrl = process.env.NEXT_PUBLIC_FARCASTER_OPTIMISM_RPC_URL;
    config.rpcUrl = rpcUrl && rpcUrl.length > 0 ? rpcUrl : 'https://mainnet.optimism.io';

    const relayBase = process.env.NEXT_PUBLIC_FARCASTER_RELAY_URL || 'https://relay.farcaster.xyz';
    config.relay = relayBase;

    const domainEnv = process.env.NEXT_PUBLIC_DOMAIN;
    if (domainEnv && domainEnv.length > 0) {
      config.domain = domainEnv;
    } else if (typeof window !== 'undefined') {
      config.domain = window.location.host;
    }

    const siweUriEnv = process.env.NEXT_PUBLIC_FARCASTER_SIWE_URI;
    if (siweUriEnv && siweUriEnv.length > 0) {
      config.siweUri = siweUriEnv;
    } else if (typeof window !== 'undefined') {
      config.siweUri = `${window.location.origin}/login`;
    }

    return config;
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
        <AuthKitProvider config={authKitConfig}>
          {walletWrappedChildren}
        </AuthKitProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
