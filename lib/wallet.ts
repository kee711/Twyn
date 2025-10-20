import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import type { Config } from 'wagmi';
import { base, mainnet, optimism } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const walletAppName = process.env.NEXT_PUBLIC_APP_NAME || 'Threads SaaS';

const chains = [base, optimism, mainnet];

const transports = chains.reduce<Record<number, ReturnType<typeof http>>>((acc, chain) => {
  acc[chain.id] = http();
  return acc;
}, {});

export const walletEnabled = Boolean(projectId);

export function createWalletConfig(): Config | null {
  if (!projectId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[wallet] Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Wallet features are disabled.');
    }
    return null;
  }

  return getDefaultConfig({
    appName: walletAppName,
    projectId,
    chains,
    transports,
    ssr: true,
  });
}

