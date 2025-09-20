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
                  {t('noAccountsRegistered')}
                </div>
              ) : (
                <div className="space-y-2">
                  {platformAccounts.map((account) => {
                    const isSelected = selection === account.id;
                    return (
                      <button
                        type="button"
                        key={account.id}
                        onClick={() => handleSelectAccount(platform, account.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${isSelected ? 'border-primary bg-primary/5 text-foreground' : 'border-border/40 bg-card hover:border-primary'}`}
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
              onClick={() => { window.location.href = '/api/threads/oauth'; closeProviderModal(); }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 transition hover:border-primary hover:bg-primary/5"
            >
              <Image src="/threads_logo_blk.svg" alt="Threads logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="font-medium">Threads</span>
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/api/x/oauth'; closeProviderModal(); }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 transition hover:border-primary hover:bg-primary/5"
            >
              <Image src="/x-logo.jpg" alt="X logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="font-medium">X</span>
            </button>
            <div className="farcaster-signin-wrapper">
              <SignInButton
                hideSignOut
                onSuccess={handleFarcasterSuccess}
                onError={handleFarcasterError}
              />
              Farcaster
            </div>
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
