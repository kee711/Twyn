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
        const threadsAccountId = nextSelected.threads;
        let threadsAccount = threadsAccountId
          ? accounts.find(acc => acc.id === threadsAccountId)
          : undefined;

        if (!threadsAccount) {
          threadsAccount = accounts.find(acc => acc.platform === 'threads');
          if (threadsAccount) {
            nextSelected.threads = threadsAccount.id;
          }
        }

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
          const [{ data: accounts, error: accountsError }, { data: selected, error: selectedError }] = await Promise.all([
            supabase
              .from('social_accounts')
              .select('id, owner, platform, social_id, username, is_active')
              .eq('owner', userId)
              .eq('is_active', true),
            supabase
              .from('user_selected_accounts')
              .select('platform, social_account_id')
              .eq('user_id', userId)
          ]);

          if (accountsError) throw accountsError;
          if (selectedError) throw selectedError;

          const selectedMap: SelectedAccountMap = {};
          selected?.forEach(item => {
            selectedMap[item.platform as PlatformKey] = item.social_account_id;
          });

          get().setAccounts((accounts || []) as SocialAccount[], selectedMap);
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

          const { error } = await supabase
            .from('user_selected_accounts')
            .upsert({
              user_id: userId,
              platform,
              social_account_id: socialAccountId,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,platform' });

          if (error) throw error;

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
