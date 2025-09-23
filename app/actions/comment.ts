'use server';

import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { createClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/utils/crypto';
import { getSelectedSocialAccount, getSelectedAccessToken } from '@/lib/server/socialAccounts';
import type { ContentItem } from '@/components/contents-helper/types';

interface PostComment {
  media_type: string;
  text: string;
  reply_to_id: string;
}

interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  replies: PostComment[];
  is_replied: boolean;
  root_post: string;
  root_post_content?: ContentItem;
}

interface MentionRecord {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  is_replied: boolean;
  root_post: string | null;
  replies?: PostComment[];
  root_post_content?: ContentItem;
}

async function ensureThreadsContext(userId: string) {
  const account = await getSelectedSocialAccount(userId, 'threads');
  if (!account) {
    throw new Error('Threads 계정이 선택되지 않았습니다.');
  }
  if (!account.access_token) {
    throw new Error('Threads access token이 없습니다.');
  }

  const accessToken = decryptToken(account.access_token);
  return { account, accessToken };
}

export async function getThreadsAccessToken() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.');
  }

  const token = await getSelectedAccessToken(session.user.id, 'threads');
  if (!token) {
    throw new Error('Threads 계정이 선택되지 않았습니다.');
  }

  return token;
}

export async function getRootPostId(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('my_contents')
    .select('*')
    .eq('social_id', id)
    .eq('publish_status', 'posted');

  if (error) {
    throw new Error(`내 게시물 조회 중 오류 발생: ${error.message}`);
  }

  return data || [];
}

export async function getComment(id: string, userId: string) {
  const supabase = await createClient();
  const { account } = await ensureThreadsContext(userId);

  const username = account.username;
  if (!username) {
    throw new Error('Threads username이 없습니다.');
  }

  const { data, error } = await supabase
    .from('comment')
    .select('*')
    .eq('root_post', id)
    .not('hide_status', 'is', true)
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`댓글 조회 중 오류 발생: ${error.message}`);
  }

  return (data || []).filter((c: Comment) => c.username !== username);
}

export async function markCommentAsReplied(commentId: string, reply: PostComment) {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from('comment')
    .select('replies')
    .eq('id', commentId)
    .single();

  if (fetchError) {
    throw new Error('댓글 데이터를 가져오는 중 오류가 발생했습니다.');
  }

  const updatedReplies = [...(existing?.replies || []), reply];

  const { error: updateError } = await supabase
    .from('comment')
    .update({
      is_replied: true,
      replies: updatedReplies,
    })
    .eq('id', commentId);

  if (updateError) {
    throw new Error('답글을 저장하는 중 오류가 발생했습니다.');
  }
}

export async function postComment({ media_type, text, reply_to_id }: PostComment) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.');
  }

  const userId = session.user.id;
  const { account, accessToken } = await ensureThreadsContext(userId);

  const payload = new URLSearchParams({
    media_type,
    text,
    reply_to_id,
    access_token: accessToken,
  });

  const createResponse = await axios.post('https://graph.threads.net/v1.0/me/threads', payload);

  if (createResponse.status !== 200) {
    throw new Error('Failed to create thread.');
  }

  const mediaContainerId = createResponse.data.id;
  const publishUrl = `https://graph.threads.net/v1.0/${account.social_id}/threads_publish`;
  const publishParams = new URLSearchParams({
    creation_id: mediaContainerId,
    access_token: accessToken,
  });

  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const publishResponse = await axios.post(publishUrl, publishParams);
      if (publishResponse.status === 200) {
        return publishResponse.data;
      }
    } catch (error) {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }

  throw new Error('Failed to publish post after multiple attempts.');
}

export async function hideComment(commentId: string) {
  const accessToken = await getThreadsAccessToken();
  const endpoint = `https://graph.threads.net/v1.0/${commentId}`;
  const params = new URLSearchParams({ access_token: accessToken, hide: 'true' });

  const response = await axios.post(endpoint, params);
  if (response.status !== 200) {
    throw new Error('Failed to hide comment.');
  }
}

export async function unhideComment(commentId: string) {
  const accessToken = await getThreadsAccessToken();
  const endpoint = `https://graph.threads.net/v1.0/${commentId}`;
  const params = new URLSearchParams({ access_token: accessToken, hide: 'false' });

  const response = await axios.post(endpoint, params);
  if (response.status !== 200) {
    throw new Error('Failed to unhide comment.');
  }
}

export async function getAllCommentsWithRootPosts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.');
  }

  let account;
  try {
    account = await requireSelectedSocialAccount(session.user.id, 'threads');
  } catch (error) {
    console.warn('getAllCommentsWithRootPosts: Threads 계정 미선택으로 빈 결과 반환');
    return { comments: [], postsWithComments: [], hiddenComments: [] };
  }

  const rootPosts: ContentItem[] = await getRootPostId(account.social_id);
  if (!rootPosts.length) {
    return { comments: [], postsWithComments: [], hiddenComments: [] };
  }

  const results = await Promise.all(rootPosts.map(async (post) => {
    try {
      return await getComment(post.media_id ?? '', session.user!.id);
    } catch (error) {
      console.warn('Failed to fetch comments for post', post.media_id, error);
      return [] as Comment[];
    }
  }));

  const flatData: Comment[] = results.flat();
  const commentsWithRoot = flatData.map((comment) => ({
    ...comment,
    replies: comment.replies || [],
    root_post_content: rootPosts.find(post => post.media_id === comment.root_post),
  }));

  const uniqueComments = Array.from(new Map(commentsWithRoot.map(item => [item.id, item])).values());
  const hiddenComments = uniqueComments.filter(item => item.is_replied).map(item => item.id);

  const commentedMediaIds = new Set(uniqueComments.map(item => item.root_post_content?.media_id));
  const postsWithComments = rootPosts.filter(post => commentedMediaIds.has(post.media_id));

  return {
    comments: uniqueComments,
    postsWithComments,
    hiddenComments,
  };
}

export async function getAllMentionsWithRootPosts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.');
  }

  let account;
  try {
    account = await requireSelectedSocialAccount(session.user.id, 'threads');
  } catch (error) {
    console.warn('getAllMentionsWithRootPosts: Threads 계정 미선택으로 빈 결과 반환');
    return { mentions: [], hiddenMentions: [] };
  }

  const supabase = await createClient();

  const { data: mentions, error: mentionError } = await supabase
    .from('mention')
    .select('*')
    .eq('mentioned_user_id', account.social_id)
    .order('timestamp', { ascending: false });

  if (mentionError) {
    throw new Error(mentionError.message);
  }

  if (!mentions?.length) {
    return { mentions: [], hiddenMentions: [] };
  }

  const rootIds = Array.from(new Set(mentions.map(m => m.root_post).filter(Boolean))) as string[];
  let rootPosts: ContentItem[] = [];
  if (rootIds.length > 0) {
    const { data: rootData, error: rootError } = await supabase
      .from('my_contents')
      .select('*')
      .in('media_id', rootIds);

    if (rootError) {
      throw new Error(rootError.message);
    }
    rootPosts = rootData || [];
  }

  const mentionsWithRoot: MentionRecord[] = mentions.map((mention) => ({
    ...mention,
    replies: mention.replies || [],
    root_post_content: rootPosts.find(post => post.media_id === mention.root_post) || null,
  }));

  const hiddenMentions = mentionsWithRoot.filter(m => m.is_replied).map(m => m.id);

  return {
    mentions: mentionsWithRoot,
    hiddenMentions,
  };
}
