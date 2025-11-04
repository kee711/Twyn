'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/authOptions';
import { getSelectedAccessToken } from '@/lib/server/socialAccounts';

const THREADS_HOSTS = new Set(['threads.net', 'www.threads.net']);
const USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;

interface ThreadsApiPost {
  id: string;
  url: string;
  title: string;
  content: string;
  username: string;
  timestamp: string | null;
  like_count: number;
  reply_count: number;
  quality_score: number;
  relevance_score: number;
  final_score: number;
}

const ensureHttpsUrl = (value: string) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    const prefix = value.startsWith('http') ? '' : 'https://';
    return `${prefix}${value}`.replace(/([^:]\/)\/+/g, '$1');
  }
};

const isValidThreadsPermalink = (permalink?: string | null, username?: string) => {
  if (!permalink) return false;

  let url: URL;
  try {
    url = new URL(permalink);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (!THREADS_HOSTS.has(host)) {
    return false;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return false;
  }

  let slug: string | undefined;

  if (segments[0].startsWith('@')) {
    const handle = segments[0].slice(1);
    if (username && handle.toLowerCase() !== username.toLowerCase()) {
      return false;
    }

    if (segments.length < 3) {
      return false;
    }

    if (!['post', 'thread'].includes(segments[1])) {
      return false;
    }

    slug = segments[2];
  } else if (segments[0] === 't' && segments.length >= 2) {
    slug = segments[1];
  }

  if (!slug) {
    return false;
  }

  const trimmed = slug.trim();
  if (trimmed.length < 6) {
    return false;
  }

  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return false;
  }

  const hasLetter = /[A-Za-z]/.test(trimmed);
  const hasDigit = /\d/.test(trimmed);

  if (!hasLetter && hasDigit) {
    return trimmed.length >= 10;
  }

  if (!hasLetter && !hasDigit) {
    return false;
  }

  return true;
};

const normalizeNumericField = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const buildPostFromApi = (item: Record<string, unknown>, warnings: Set<string>): ThreadsApiPost | null => {
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  if (!id) {
    warnings.add('Threads 응답에 ID가 없는 게시물이 포함되어 제거되었습니다.');
    return null;
  }

  const text = typeof item.text === 'string' ? item.text.trim() : '';
  if (!text) {
    warnings.add(`게시물 ${id}에 본문이 없어 제거되었습니다.`);
    return null;
  }

  const username = typeof item.username === 'string' ? item.username.trim() : '';
  if (!username) {
    warnings.add(`게시물 ${id}에 사용자명이 없어 제거되었습니다.`);
    return null;
  }

  if (!USERNAME_PATTERN.test(username)) {
    warnings.add(`게시물 ${id}의 사용자명이 유효하지 않아 제거되었습니다.`);
    return null;
  }

  const rawPermalink =
    (typeof item.permalink === 'string' && item.permalink.trim()) ||
    (typeof item.permalink_url === 'string' && item.permalink_url.trim()) ||
    '';

  let permalink = ensureHttpsUrl(rawPermalink);
  if (!isValidThreadsPermalink(permalink, username)) {
    const fallback = `https://www.threads.net/@${username}/post/${id}`;
    if (isValidThreadsPermalink(fallback, username)) {
      permalink = fallback;
    } else {
      warnings.add(`게시물 ${id}의 링크가 유효하지 않아 제거되었습니다.`);
      return null;
    }
  }

  return {
    id,
    url: permalink,
    title: `@${username} - Threads Post`,
    content: text,
    username,
    timestamp: typeof item.timestamp === 'string' ? item.timestamp : null,
    like_count: normalizeNumericField(item.like_count),
    reply_count: normalizeNumericField(item.reply_count),
    quality_score: 0.8,
    relevance_score: 0.9,
    final_score: 0.85,
  };
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const queryCandidate =
    typeof body?.query === 'string'
      ? body.query
      : typeof body?.keyword === 'string'
        ? body.keyword
        : typeof body?.topic === 'string'
          ? body.topic
          : '';

  const query = queryCandidate.trim();
  const parsedLimit = Number(body?.limit);
  const limitValue = Number.isFinite(parsedLimit) ? parsedLimit : 20;
  const limit = Math.min(Math.max(Math.floor(limitValue) || 20, 1), 50);

  if (!query) {
    return NextResponse.json(
      { error: '검색어를 입력해주세요.' },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  const accessToken = await getSelectedAccessToken(session.user.id, 'threads');
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Threads 계정을 연결하고 기본 계정으로 설정해주세요.' },
      { status: 400 },
    );
  }

  const searchParams = new URLSearchParams({
    access_token: accessToken,
    q: query,
    search_type: 'TOP',
    limit: String(limit),
    fields: [
      'id',
      'text',
      'media_type',
      'permalink',
      'permalink_url',
      'timestamp',
      'username',
      'has_replies',
      'is_quote_post',
      'is_reply',
      'like_count',
      'reply_count',
    ].join(','),
  });

  let rawResponse: Response;
  try {
    rawResponse = await fetch(`https://graph.threads.net/v1.0/keyword_search?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[threads/search] Network error calling Threads API', error);
    return NextResponse.json(
      { error: 'Threads API 호출에 실패했습니다.' },
      { status: 502 },
    );
  }

  let payload: any = {};
  try {
    payload = await rawResponse.json();
  } catch (error) {
    console.error('[threads/search] Failed to parse Threads API response', error);
    return NextResponse.json(
      { error: 'Threads API 응답을 해석할 수 없습니다.' },
      { status: 502 },
    );
  }

  if (!rawResponse.ok) {
    const message =
      (payload?.error && typeof payload.error.message === 'string' && payload.error.message) ||
      'Threads API 검색이 실패했습니다.';
    console.error('[threads/search] Threads API returned error', {
      status: rawResponse.status,
      message,
      payload,
    });
    return NextResponse.json(
      { error: message, status: rawResponse.status, details: payload?.error ?? payload },
      { status: rawResponse.status },
    );
  }

  const warnings = new Set<string>();
  const posts: ThreadsApiPost[] = [];
  const seen = new Set<string>();

  if (Array.isArray(payload?.data)) {
    for (const item of payload.data) {
      if (!item || typeof item !== 'object') continue;
      const post = buildPostFromApi(item as Record<string, unknown>, warnings);
      if (!post) continue;

      if (seen.has(post.id)) {
        continue;
      }
      seen.add(post.id);
      posts.push(post);
    }
  }

  return NextResponse.json({
    query,
    count: posts.length,
    results: posts,
    warnings: Array.from(warnings),
  });
}
