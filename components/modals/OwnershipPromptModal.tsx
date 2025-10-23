'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { cn } from '@/lib/utils';

interface OwnershipPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (value: boolean) => void;
  onContinueWithout: () => void;
  onConnectWallet: () => void;
  onPublishWithReceipt?: () => void;
  canPublishWithReceipt?: boolean;
}

export function OwnershipPromptModal({
  open,
  onOpenChange,
  dontShowAgain,
  onDontShowAgainChange,
  onContinueWithout,
  onConnectWallet,
  onPublishWithReceipt,
  canPublishWithReceipt = false,
}: OwnershipPromptModalProps) {
  const t = useTranslations('ownershipPrompt');
  const subtitle = useMemo(() => t('subtitle'), [t]);
  const bulletItems = useMemo(
    () => [t('bullet1'), t('bullet2'), t('bullet3')],
    [t],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border border-border/60 bg-white/95 p-6 shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground/90">
          <ul className="list-disc space-y-1.5 pl-4">
            {bulletItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-background/90 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{t('rememberLabel')}</span>
            <span className="text-xs text-muted-foreground">{t('rememberCaption')}</span>
          </div>
          <Switch
            checked={dontShowAgain}
            onCheckedChange={onDontShowAgainChange}
            aria-label="Do not show this prompt again"
          />
        </div>

        <DialogFooter className={cn('mt-2 w-full flex-col gap-3 sm:flex-col sm:items-stretch sm:justify-start sm:space-x-0')}>
          {canPublishWithReceipt ? (
            <Button
              type="button"
              className="h-11 w-full justify-center rounded-xl text-sm font-semibold"
              onClick={onPublishWithReceipt}
            >
              {t('publishWithReceipt')}
            </Button>
          ) : (
          <WalletConnectButton
            size="xs"
            variant="default"
            className="w-full justify-center"
            onOpenConnectModal={onConnectWallet}
          />
          )}
          <Button
            variant="outline"
            className="h-11 w-full justify-center rounded-xl border-border/60 text-sm font-medium text-foreground/90"
            onClick={onContinueWithout}
          >
            {t('continueWithout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
