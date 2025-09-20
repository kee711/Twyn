import { createClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/utils/crypto';

export type PlatformKey = 'threads' | 'x' | 'farcaster';

export interface SocialAccountRecord {
  id: string;
  owner: string;
  platform: PlatformKey;
  social_id: string;
  username?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  is_active: boolean;
  expires_at?: string | null;
}

export async function getSelectedSocialAccount(userId: string, platform: PlatformKey) {
  const supabase = await createClient();

  const { data: selection, error: selectionError } = await supabase
    .from('user_selected_accounts')
    .select('social_account_id')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();

  if (selectionError) {
    console.error('[socialAccounts] selection fetch error', selectionError);
    return null;
  }

  const socialAccountId = selection?.social_account_id;
  if (!socialAccountId) {
    return null;
  }

  const { data: account, error: accountError } = await supabase
    .from('social_accounts')
    .select('id, owner, platform, social_id, username, access_token, refresh_token, is_active, expires_at')
    .eq('id', socialAccountId)
    .eq('is_active', true)
    .maybeSingle();

  if (accountError) {
    console.error('[socialAccounts] account fetch error', accountError);
    return null;
  }

  return account as SocialAccountRecord | null;
}

export async function requireSelectedSocialAccount(userId: string, platform: PlatformKey) {
  const account = await getSelectedSocialAccount(userId, platform);
  if (!account) {
    throw new Error(`${platform} 계정이 선택되지 않았습니다.`);
  }
  return account;
}

export async function getSelectedSocialId(userId: string, platform: PlatformKey) {
  const account = await getSelectedSocialAccount(userId, platform);
  return account?.social_id || null;
}

export async function requireSelectedSocialId(userId: string, platform: PlatformKey) {
  const account = await requireSelectedSocialAccount(userId, platform);
  return account.social_id;
}

export async function getSelectedAccessToken(userId: string, platform: PlatformKey) {
  const account = await getSelectedSocialAccount(userId, platform);
  if (!account?.access_token) {
    return null;
  }

  try {
    return decryptToken(account.access_token);
  } catch (error) {
    console.error('[socialAccounts] decrypt error', error);
    return null;
  }
}

export async function requireSelectedAccessToken(userId: string, platform: PlatformKey) {
  const token = await getSelectedAccessToken(userId, platform);
  if (!token) {
    throw new Error(`${platform} access token이 없습니다.`);
  }
  return token;
}

export async function setSelectedSocialAccount(
  userId: string,
  platform: PlatformKey,
  socialAccountId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_selected_accounts')
    .upsert({
      user_id: userId,
      platform,
      social_account_id: socialAccountId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });

  if (error) {
    throw error;
  }
}
