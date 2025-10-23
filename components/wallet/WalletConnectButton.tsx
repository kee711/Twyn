'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTranslations } from 'next-intl';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { walletEnabled } from '@/lib/wallet';

interface WalletConnectButtonProps {
  className?: string;
  onOpenConnectModal?: () => void;
  size?: 'xs' | 'sm' | 'lg';
  variant?: ButtonProps['variant'];
}

const baseButtonClass: Record<NonNullable<WalletConnectButtonProps['size']>, string> = {
  xs: 'h-11 w-full rounded-xl text-sm font-semibold',
  sm: 'h-8 px-3 text-xs font-medium rounded-lg',
  lg: 'h-12 px-6 text-sm font-semibold rounded-xl',
};

const sizeMap: Record<NonNullable<WalletConnectButtonProps['size']>, ButtonProps['size']> = {
  xs: 'xl',
  sm: 'sm',
  lg: 'lg',
};

export function WalletConnectButton({
  className,
  onOpenConnectModal,
  size = 'sm',
  variant = 'outline',
}: WalletConnectButtonProps) {
  const t = useTranslations('SocialAccountSelector');

  if (!walletEnabled) {
    return (
      <Button
        variant={variant}
        size={sizeMap[size]}
        type="button"
        className={cn(baseButtonClass[size], className)}
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
              variant={variant}
              size={sizeMap[size]}
              type="button"
              className={cn(baseButtonClass[size], className)}
              disabled
            >
              {t('connectWallet')}
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button
              variant={variant}
              size={sizeMap[size]}
              type="button"
              className={cn(baseButtonClass[size], className)}
              onClick={() => {
                if (!openConnectModal) return;
                onOpenConnectModal?.();
                requestAnimationFrame(() => openConnectModal());
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
              size={sizeMap[size]}
              type="button"
              className={cn(baseButtonClass[size], className)}
              onClick={openChainModal}
            >
              {t('switchNetwork')}
            </Button>
          );
        }

        return (
          <Button
            variant={variant}
            size={sizeMap[size]}
            type="button"
            className={cn(baseButtonClass[size], 'gap-2', className)}
            onClick={() => {
              onOpenConnectModal?.();
              requestAnimationFrame(() => openAccountModal());
            }}
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
