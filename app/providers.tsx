'use client'

import '@farcaster/auth-kit/styles.css'
import '@rainbow-me/rainbowkit/styles.css'

import { AuthKitProvider } from '@farcaster/auth-kit'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useMemo, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'

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

  // Mini app initialization is now handled by MiniAppInitializer component

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
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_COINBASE_API_KEY}
        chain={base}
      >
        <RainbowKitProvider modalSize="compact">
          {children}
        </RainbowKitProvider>
      </OnchainKitProvider>
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
