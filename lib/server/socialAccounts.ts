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

  const targetId = selection?.social_account_id;
  if (!targetId) return null;

  const { data: account, error } = await supabase
    .from('social_accounts')
    .select('id, owner, platform, social_id, username, access_token, refresh_token, is_active, expires_at')
    .eq('id', targetId)
    .eq('platform', platform)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[socialAccounts] account fetch error', error);
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
  console.log('[socialAccounts] getSelectedAccessToken called', { userId, platform });

  const account = await getSelectedSocialAccount(userId, platform);
  console.log('[socialAccounts] selected account result', {
    hasAccount: !!account,
    accountId: account?.id,
    hasToken: !!account?.access_token,
    platform: account?.platform,
    isActive: account?.is_active
  });

  if (account?.access_token) {
    try {
      const token = decryptToken(account.access_token);
      console.info('[socialAccounts] decrypted access token from selected account', {
        userId,
        platform,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...' // 토큰의 앞부분만 로깅
      });
      return token;
    } catch (error) {
      console.error('[socialAccounts] decrypt error (selected account)', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: account.id
      });
      // Fall through to legacy lookup
    }
  } else {
    console.warn('[socialAccounts] No access token in selected account', {
      accountId: account?.id,
      platform
    });
  }

  try {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('selected_social_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('[socialAccounts] legacy profile lookup failed', profileError);
      return null;
    }

    const legacySocialId = profile?.selected_social_id;
    if (!legacySocialId) {
      console.info('[socialAccounts] no legacy selected_social_id for user', { userId, platform });
      return null;
    }

    const { data: legacyAccount, error: legacyAccountError } = await supabase
      .from('social_accounts')
      .select('access_token')
      .eq('social_id', legacySocialId)
      .eq('platform', platform)
      .eq('is_active', true)
      .maybeSingle();

    if (legacyAccountError) {
      console.warn('[socialAccounts] legacy account lookup failed', legacyAccountError);
      return null;
    }

    if (!legacyAccount?.access_token) {
      console.warn('[socialAccounts] legacy account missing access token', {
        userId,
        platform,
        socialId: legacySocialId,
      });
      return null;
    }

    const token = decryptToken(legacyAccount.access_token);
    console.info('[socialAccounts] decrypted legacy access token', {
      userId,
      platform,
      socialId: legacySocialId,
      tokenLength: token.length,
    });
    return token;
  } catch (fallbackError) {
    console.error('[socialAccounts] legacy token retrieval failed', fallbackError);
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
      is_primary: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });

  if (error) {
    throw error;
  }
}
