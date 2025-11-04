'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import useSocialAccountStore, { PlatformKey, SocialAccount } from '@/stores/useSocialAccountStore';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { OnboardingModal } from './OnboardingModal';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { SignInButton } from '@farcaster/auth-kit';

interface SocialAccountSelectorProps {
  className?: string;
}

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  threads: 'Threads',
  x: 'X',
  farcaster: 'Farcaster',
};

const PLATFORM_DISABLED: Record<PlatformKey, boolean> = {
  threads: false,
  x: true,
  farcaster: true,
};

const CONNECT_DISABLED_MESSAGE: Partial<Record<PlatformKey, string>> = {
  x: 'xComingSoon',
  farcaster: 'farcasterComingSoon',
};

export function SocialAccountSelector({ className }: SocialAccountSelectorProps) {
  const t = useTranslations('SocialAccountSelector');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newAccountId, setNewAccountId] = useState<string | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const { data: session } = useSession();
  const {
    accounts,
    selectedAccounts,
    isLoading,
    fetchAccounts,
    selectAccount,
  } = useSocialAccountStore();

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchAccounts(session.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !session?.user?.id) return;
    const urlParams = new URLSearchParams(window.location.search);
    const accountAdded = urlParams.get('account_added');
    const accountId = urlParams.get('account_id');
    if (accountAdded === 'true' && accountId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setNewAccountId(accountId);
      setShowOnboarding(true);
      fetchAccounts(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const handleFarcasterSuccess = async (payload: any) => {
    const fid = payload?.fid;
    const username = payload?.username;
    if (!fid || !session?.user?.id) {
      toast.error(t('farcasterSignInError'));
      return;
    }

    try {
      const response = await fetch('/api/farcaster/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, username }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist Farcaster account');
      }

      toast.success(t('farcasterLinkSuccess'));

      // Singer Flow Autostart after login

      // const signerStart = await fetch('/api/farcaster/signer/start', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ fid: Number(fid) }),
      // });

      // if (signerStart.ok) {
      //   const startData = await signerStart.json().catch(() => ({}));
      //   const token: string | undefined = startData?.token;
      //   const deeplinkUrl: string | undefined = startData?.deeplinkUrl;

      //   if (deeplinkUrl) {
      //     const win = window.open(deeplinkUrl, '_blank', 'noopener');
      //     if (!win) {
      //       window.location.href = deeplinkUrl;
      //     }
      //     toast.info('Warpcast 앱에서 signer 승인을 완료해주세요.');
      //   }

      //   if (token) {
      //     const result = await pollSignerStatus(token);
      //     if (result === 'completed') {
      //       toast.success('Farcaster signer가 활성화되었습니다.');
      //     } else if (result === 'expired') {
      //       toast.error('Signer 요청이 만료되었습니다. 다시 시도해주세요.');
      //     } else if (result === 'revoked') {
      //       toast.error('Signer 요청이 취소되었습니다. 다시 시도해주세요.');
      //     } else if (result === 'timeout') {
      //       toast.info('Signer 승인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
      //     }
      //   }
      // } else {
      //   const errorData = await signerStart.json().catch(() => ({}));
      //   console.error('Failed to start Farcaster signer flow', errorData);
      //   toast.error('Signer 요청을 시작하지 못했습니다. 다시 시도해주세요.');
      // }

      await fetchAccounts(session.user.id);
    } catch (error) {
      console.error('Farcaster account link failed:', error);
      toast.error(t('farcasterSignInError'));
    } finally {
      setShowProviderModal(false);
    }
  };

  const handleFarcasterError = (error?: unknown) => {
    console.error('Farcaster sign-in error:', error);
    toast.error(t('farcasterSignInError'));
    setShowProviderModal(false);
  };

  const pollSignerStatus = async (token: string) => {
    const maxAttempts = 20;
    const delayMs = 3000;

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await wait(delayMs);
      try {
        const res = await fetch(`/api/farcaster/signer/status?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          continue;
        }

        const state: string | undefined = data?.signedKeyRequest?.state;
        if (!state) continue;

        if (state === 'completed') {
          if (session?.user?.id) {
            await fetchAccounts(session.user.id);
          }
          return 'completed';
        }

        if (state === 'expired' || state === 'revoked') {
          if (session?.user?.id) {
            await fetchAccounts(session.user.id);
          }
          return state as 'expired' | 'revoked';
        }
      } catch (error) {
        console.error('Failed to poll signer status', error);
      }
    }

    return 'timeout';
  };

  const groupedAccounts = useMemo(() => {
    const groups: Record<PlatformKey, SocialAccount[]> = {
      threads: [],
      x: [],
      farcaster: [],
    };
    accounts.forEach((account) => {
      if (groups[account.platform as PlatformKey]) {
        groups[account.platform as PlatformKey].push(account);
      }
    });
    return groups;
  }, [accounts]);

  const handleSelectAccount = async (platform: PlatformKey, socialAccountId: string) => {
    if (!session?.user?.id) return;
    try {
      await selectAccount(session.user.id, platform, socialAccountId);
      toast.success(t('selectionSaved'));
    } catch (error) {
      console.error('Failed to select account', error);
      toast.error(t('failedToSaveSelection'));
    }
  };

  const openProviderModal = () => setShowProviderModal(true);
  const closeProviderModal = () => setShowProviderModal(false);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-border/40 bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
          {t('loadingAccounts')}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{t('accountList')}</span>
        <Button variant="ghost" size="sm" onClick={openProviderModal} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          {t('addAccount')}
        </Button>
      </div>

      <div className="space-y-4">
        {(Object.keys(groupedAccounts) as PlatformKey[]).map((platform) => {
          const platformAccounts = groupedAccounts[platform];
          const selection = selectedAccounts[platform];
          const isConnectDisabled = PLATFORM_DISABLED[platform] ?? false;
          const comingSoonKey = CONNECT_DISABLED_MESSAGE[platform];
          const emptyStateMessage = comingSoonKey
            ? t(comingSoonKey as any)
            : t('noAccountsRegistered');
          return (
            <div key={platform} className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">{PLATFORM_LABELS[platform]}</span>
                {selection ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />{t('active')}</span>
                ) : null}
              </div>
              {platformAccounts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {emptyStateMessage}
                </div>
              ) : (
                <div className="space-y-2">
                  {platformAccounts.map((account) => {
                    const isSelected = selection === account.id;
                    const isDisabled = isConnectDisabled;
                    return (
                      <button
                        type="button"
                        key={account.id}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) return;
                          handleSelectAccount(platform, account.id);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${isDisabled ? 'cursor-not-allowed opacity-60' : 'transition hover:border-primary'} ${isSelected ? 'border-primary bg-primary/5 text-foreground' : 'border-border/40 bg-card'}`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{account.username || account.social_id}</span>
                          <span className="text-xs text-muted-foreground">{account.social_id}</span>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('choosePlatform')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={PLATFORM_DISABLED.threads}
              onClick={() => {
                if (PLATFORM_DISABLED.threads) return;
                window.location.href = '/api/threads/oauth';
                closeProviderModal();
              }}
              className={`flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 ${PLATFORM_DISABLED.threads ? 'cursor-not-allowed opacity-60' : 'transition hover:border-primary hover:bg-primary/5'}`}
            >
              <Image src="/threads_logo_blk.svg" alt="Threads logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Threads</span>
                {PLATFORM_DISABLED.threads ? (
                  <span className="text-xs text-muted-foreground">{t('threadsComingSoon')}</span>
                ) : null}
              </div>
            </button>
            <button
              type="button"
              disabled={PLATFORM_DISABLED.x}
              onClick={() => {
                if (PLATFORM_DISABLED.x) return;
                window.location.href = '/api/x/oauth';
                closeProviderModal();
              }}
              className={`flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 ${PLATFORM_DISABLED.x ? 'cursor-not-allowed opacity-60' : 'transition hover:border-primary hover:bg-primary/5'}`}
            >
              <Image src="/x-logo.jpg" alt="X logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <div className="flex flex-col items-start">
                <span className="font-medium">X</span>
                {PLATFORM_DISABLED.x ? (
                  <span className="text-xs text-muted-foreground">{t('xComingSoon')}</span>
                ) : null}
              </div>
            </button>
            {PLATFORM_DISABLED.farcaster ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 cursor-not-allowed opacity-60"
              >
                <Image src="/farcaster-logo.svg" alt="Farcaster logo" width={32} height={32} className="h-8 w-8 object-contain" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Farcaster</span>
                  <span className="text-xs text-muted-foreground">{t('farcasterComingSoon')}</span>
                </div>
              </button>
            ) : (
              <div className="farcaster-signin-wrapper">
                <SignInButton
                  hideSignOut
                  onSuccess={handleFarcasterSuccess}
                  onError={handleFarcasterError}
                />
                Farcaster
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showOnboarding && newAccountId && (
        <OnboardingModal
          open={showOnboarding}
          onClose={() => {
            setShowOnboarding(false);
            setNewAccountId(null);
            if (session?.user?.id) fetchAccounts(session.user.id);
          }}
          socialAccountId={newAccountId}
        />
      )}
    </div>
  );
}
