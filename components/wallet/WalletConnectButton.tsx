'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { walletEnabled } from '@/lib/wallet';

interface WalletConnectButtonProps {
  className?: string;
  onOpenConnectModal?: () => void;
}

const baseButtonClass = 'h-8 px-3 text-xs font-medium rounded-lg';

export function WalletConnectButton({
  className,
  onOpenConnectModal,
}: WalletConnectButtonProps) {
  const t = useTranslations('SocialAccountSelector');

  if (!walletEnabled) {
    return (
      <Button
        variant="outline"
        size="sm"
        type="button"
        className={cn(baseButtonClass, className)}
        disabled
        title={t('connectWalletUnavailable')}
      >
        {t('connectWallet')}
      </Button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        authenticationStatus,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <Button
              variant="outline"
              size="sm"
              type="button"
              className={cn(baseButtonClass, className)}
              disabled
            >
              {t('connectWallet')}
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button
              variant="outline"
              size="sm"
              type="button"
              className={cn(baseButtonClass, className)}
              onClick={() => {
                if (!openConnectModal) return;
                onOpenConnectModal?.();
                openConnectModal();
              }}
            >
              {t('connectWallet')}
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              variant="destructive"
              size="sm"
              type="button"
              className={cn(baseButtonClass, className)}
              onClick={openChainModal}
            >
              {t('switchNetwork')}
            </Button>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className={cn(baseButtonClass, 'gap-2', className)}
            onClick={openAccountModal}
          >
            {chain.hasIcon && chain.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={chain.name ?? 'chain icon'}
                src={chain.iconUrl}
                className="h-4 w-4 rounded-full"
              />
            ) : null}
            <span className="truncate max-w-[120px]">
              {account.displayName}
            </span>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
