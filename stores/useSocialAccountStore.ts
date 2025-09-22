import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

export type PlatformKey = 'threads' | 'x' | 'farcaster';

export interface SocialAccount {
  id: string;
  social_id: string;
  owner: string;
  platform: PlatformKey;
  username?: string | null;
  is_active: boolean;
}

export type SelectedAccountMap = Partial<Record<PlatformKey, string>>;

const PLATFORM_KEYS: PlatformKey[] = ['threads', 'x', 'farcaster'];

interface SocialAccountStore {
  accounts: SocialAccount[];
  selectedAccounts: SelectedAccountMap;
  isLoading: boolean;
  currentSocialId: string;
  currentUsername: string;
  setAccounts: (accounts: SocialAccount[], selected: SelectedAccountMap) => void;
  fetchAccounts: (userId: string) => Promise<void>;
  fetchSocialAccounts: (userId: string) => Promise<void>;
  selectAccount: (userId: string, platform: PlatformKey, socialAccountId: string) => Promise<void>;
  getSelectedAccount: (platform?: PlatformKey) => SocialAccount | undefined;
}

const useSocialAccountStore = create<SocialAccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccounts: {},
      isLoading: false,
      currentSocialId: '',
      currentUsername: '',

      setAccounts: (accounts, selected) => {
        const nextSelected: SelectedAccountMap = { ...selected };

        PLATFORM_KEYS.forEach((platform) => {
          if (!nextSelected[platform]) {
            const fallback = accounts.find(acc => acc.platform === platform);
            if (fallback) {
              nextSelected[platform] = fallback.id;
            }
          }
        });

        const threadsAccountId = nextSelected.threads;
        const threadsAccount = threadsAccountId
          ? accounts.find(acc => acc.id === threadsAccountId)
          : accounts.find(acc => acc.platform === 'threads') || null;

        set({
          accounts,
          selectedAccounts: nextSelected,
          currentSocialId: threadsAccount ? threadsAccount.social_id : '',
          currentUsername: threadsAccount ? (threadsAccount.username || threadsAccount.social_id) : '',
        });
      },

      fetchAccounts: async (userId: string) => {
        const supabase = createClient();
        set({ isLoading: true });
        try {
          const nowIso = new Date().toISOString();

          const { data: accountsData, error: accountsError } = await supabase
            .from('social_accounts')
            .select('id, owner, platform, social_id, username, is_active')
            .eq('owner', userId)
            .in('platform', PLATFORM_KEYS)
            .eq('is_active', true);

          if (accountsError) {
            throw accountsError;
          }

          const accounts: SocialAccount[] = (accountsData || [])
            .filter((a: any) => PLATFORM_KEYS.includes(a.platform as PlatformKey))
            .map((a: any) => ({
              id: a.id,
              owner: a.owner,
              platform: a.platform as PlatformKey,
              social_id: a.social_id,
              username: a.username,
              is_active: a.is_active,
            }));

          const { data: selectionRows, error: selectionError } = await supabase
            .from('user_selected_accounts')
            .select('platform, social_account_id')
            .eq('user_id', userId);

          if (selectionError) {
            console.warn('[useSocialAccountStore] selection fetch error', selectionError);
          }

          const accountsByPlatform: Record<PlatformKey, SocialAccount[]> = {
            threads: [],
            x: [],
            farcaster: [],
          };

          accounts.forEach((account) => {
            accountsByPlatform[account.platform].push(account);
          });

          const selectedMap: SelectedAccountMap = {};
          const rowsByPlatform = new Map<PlatformKey, string>();

          (selectionRows || []).forEach((row: any) => {
            const platform = row.platform as PlatformKey;
            const socialAccountId = row.social_account_id as string | null;
            if (!platform || !socialAccountId) return;
            if (!PLATFORM_KEYS.includes(platform)) return;
            rowsByPlatform.set(platform, socialAccountId);
          });

          const upsertPayloads: Array<Record<string, unknown>> = [];

          PLATFORM_KEYS.forEach((platform) => {
            const platformAccounts = accountsByPlatform[platform];
            const platformSelection = rowsByPlatform.get(platform);

            if (platformSelection && platformAccounts.some(account => account.id === platformSelection)) {
              selectedMap[platform] = platformSelection;
              return;
            }

            const fallback = platformAccounts[0];
            if (!fallback) return;

            selectedMap[platform] = fallback.id;
            upsertPayloads.push({
              user_id: userId,
              platform,
              social_account_id: fallback.id,
              is_primary: true,
              updated_at: nowIso,
            });
          });

          if (upsertPayloads.length > 0) {
            const { error: upsertError } = await supabase
              .from('user_selected_accounts')
              .upsert(upsertPayloads, { onConflict: 'user_id,platform' });
            if (upsertError) {
              console.warn('[useSocialAccountStore] failed to seed selections', upsertError);
            }
          }

          get().setAccounts(accounts, selectedMap);
        } catch (error) {
          console.error('[useSocialAccountStore] fetchAccounts error', error);
          set({ accounts: [], selectedAccounts: {} });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchSocialAccounts: async (userId: string) => {
        await get().fetchAccounts(userId);
      },

      selectAccount: async (userId, platform, socialAccountId) => {
        const supabase = createClient();
        try {
          const accountRecord = get().accounts.find(acc => acc.id === socialAccountId) || null;

          const payload = {
            user_id: userId,
            platform,
            social_account_id: socialAccountId,
            is_primary: true,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from('user_selected_accounts')
            .upsert(payload, { onConflict: 'user_id,platform' });

          if (upsertError) throw upsertError;

          if (platform === 'threads' && accountRecord) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .update({ selected_social_id: accountRecord.social_id })
              .eq('user_id', userId);
            if (profileError) {
              console.warn('[useSocialAccountStore] failed to update legacy selected_social_id', profileError);
            }
          }

          set((state) => ({
            selectedAccounts: {
              ...state.selectedAccounts,
              [platform]: socialAccountId,
            },
            currentSocialId: platform === 'threads' && accountRecord ? accountRecord.social_id : state.currentSocialId,
            currentUsername: platform === 'threads' && accountRecord ? (accountRecord.username || accountRecord.social_id) : state.currentUsername,
          }));
        } catch (error) {
          console.error('[useSocialAccountStore] selectAccount error', error);
          throw error;
        }
      },

      getSelectedAccount: (platform = 'threads') => {
        const state = get();
        const accountId = state.selectedAccounts[platform];
        if (!accountId) return undefined;
        return state.accounts.find(acc => acc.id === accountId);
      },
    }),
    {
      name: 'social-account-store-v2',
      partialize: (state) => ({
        accounts: state.accounts,
        selectedAccounts: state.selectedAccounts,
        currentSocialId: state.currentSocialId,
        currentUsername: state.currentUsername,
      }),
    }
  )
);

export default useSocialAccountStore;
