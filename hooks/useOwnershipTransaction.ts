'use client';

import { useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { stringToHex } from 'viem';
import { toast } from 'sonner';

const BASE_TESTNET_EXPLORER = baseSepolia.blockExplorers?.default?.url ?? 'https://sepolia.basescan.org';

export type OwnershipActionKind = 'publish' | 'schedule' | 'edit';

export interface OwnershipMetadata {
  action: OwnershipActionKind;
  threadCount: number;
  scheduledAt?: string;
  preview?: string;
  beforePreview?: string;
  afterPreview?: string;
}

export interface OwnershipTransactionResult {
  status: 'success' | 'skipped' | 'failed';
  hash?: `0x${string}`;
  error?: unknown;
}

const OWNERSHIP_TARGET =
  (process.env.NEXT_PUBLIC_BASE_TESTNET_OWNERSHIP_ADDRESS as `0x${string}` | undefined) ?? undefined;

export function useOwnershipTransaction() {
  const { address, isConnected, status } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  const { switchChainAsync } = useSwitchChain();

  const explorerBaseUrl = useMemo(() => BASE_TESTNET_EXPLORER.replace(/\/$/, ''), []);

  const recordTransaction = useCallback(
    async (metadata: OwnershipMetadata): Promise<OwnershipTransactionResult> => {
      if (!isConnected || !walletClient) {
        return { status: 'skipped' };
      }

      const account = walletClient.account ?? (address as `0x${string}` | undefined);
      if (!account) {
        console.warn('[ownership] Missing wallet account. Skipping ownership transaction.');
        return { status: 'skipped' };
      }

      const target = OWNERSHIP_TARGET ?? account.address ?? account;
      if (!target) {
        console.warn('[ownership] Missing target address. Skipping ownership transaction.');
        return { status: 'skipped' };
      }

      try {
        if (walletClient.chain?.id !== baseSepolia.id) {
          await switchChainAsync({ chainId: baseSepolia.id });
        }

        const messageParts = [
          `action=${metadata.action}`,
          `threads=${metadata.threadCount}`,
          metadata.scheduledAt ? `scheduled_at=${metadata.scheduledAt}` : null,
          metadata.preview ? `preview=${metadata.preview.slice(0, 180)}` : null,
          metadata.beforePreview ? `before_preview=${metadata.beforePreview.slice(0, 180)}` : null,
          metadata.afterPreview ? `after_preview=${metadata.afterPreview.slice(0, 180)}` : null,
        ].filter((value): value is string => Boolean(value));

        const memo = stringToHex(messageParts.join('|'));
        const hash = await walletClient.sendTransaction({
          account,
          chain: baseSepolia,
          to: target,
          value: 0n,
          data: memo,
        });

        if (publicClient) {
          publicClient
            .waitForTransactionReceipt({ hash })
            .catch((error) => console.warn('[ownership] Failed to confirm receipt', error));
        }

        const explorerUrl = `${explorerBaseUrl}/tx/${hash}`;
        toast.success('Ownership receipt recorded on Base testnet.', {
          description: 'View the transaction in Basescan.',
          action: {
            label: 'Open explorer',
            onClick: () => window.open(explorerUrl, '_blank', 'noopener'),
          },
        });

        return { status: 'success', hash };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
        const cancelled = message.toLowerCase().includes('user rejected');

        if (cancelled) {
          toast.info('On-chain receipt cancelled. We will continue publishing as requested.');
          return { status: 'failed', error };
        }

        toast.error('Could not record ownership on Base testnet. Publishing will continue without it.');
        console.error('[ownership] Transaction failed', error);
        return { status: 'failed', error };
      }
    },
    [address, explorerBaseUrl, isConnected, publicClient, switchChainAsync, walletClient],
  );

  return {
    isConnected,
    status,
    recordTransaction,
  };
}
