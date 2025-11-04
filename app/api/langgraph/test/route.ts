import { NextResponse } from 'next/server';
import { Client } from '@langchain/langgraph-sdk';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/authOptions';
import { getSelectedAccessToken } from '@/lib/server/socialAccounts';

type StreamMode = 'updates' | 'messages-tuple';

const DEFAULT_TOPIC = 'social media marketing strategy for AI startups';
const DEFAULT_GRAPH_ID = process.env.LANGGRAPH_GRAPH_ID || 'researcher-enhanced';
const DEFAULT_STREAM_MODE: StreamMode = 'updates';

const client = new Client({
  apiUrl: process.env.LANGGRAPH_API_URL || 'http://localhost:2024',
  apiKey: process.env.LANGGRAPH_API_KEY,
});

export async function POST(request: Request) {
  let body: any = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const streamMode: StreamMode =
    body?.streamMode === 'messages-tuple' ? 'messages-tuple' : DEFAULT_STREAM_MODE;

  const graphId: string = typeof body?.graphId === 'string' && body.graphId.trim().length > 0
    ? body.graphId.trim()
    : DEFAULT_GRAPH_ID;

  const topic: string =
    typeof body?.topic === 'string' && body.topic.trim().length > 0
      ? body.topic.trim()
      : DEFAULT_TOPIC;

  const input: Record<string, unknown> =
    body?.input && typeof body.input === 'object'
      ? { ...(body.input as Record<string, unknown>) }
      : { topic };

  let threadsUserToken =
    typeof input.threads_user_token === 'string' ? (input.threads_user_token as string) : null;

  if (!threadsUserToken) {
    try {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      console.info('[langgraph][test] session resolved', {
        hasSession: Boolean(session),
        userId,
      });

      if (userId) {
        const token = await getSelectedAccessToken(userId, 'threads');
        if (token) {
          threadsUserToken = token;
          input.threads_user_token = token;
        }

        console.info('[langgraph][test] token lookup result', {
          tokenAttached: Boolean(token),
          source: token ? 'supabase' : 'missing',
        });
      } else {
        console.warn('[langgraph][test] missing session user; cannot resolve Threads token');
      }
    } catch (tokenError) {
      console.warn('[langgraph][test] failed to resolve Threads access token', tokenError);
    }
  } else {
    input.threads_user_token = threadsUserToken;
  }

  if (!threadsUserToken && 'threads_user_token' in input) {
    delete input.threads_user_token;
  }

  if (threadsUserToken) {
    console.info('[langgraph][test] threads_user_token attached to request input.');
  } else {
    console.info('[langgraph][test] threads_user_token missing; Threads search may be skipped.');
  }

  try {
    const events: Array<{ event: string; data: unknown }> = [];

    events.push({
      event: 'debug',
      data: { threads_user_token_attached: Boolean(threadsUserToken) },
    });

    const stream = client.runs.stream(null, graphId, {
      input,
      streamMode,
    });

    for await (const chunk of stream) {
      events.push({
        event: chunk.event,
        data: chunk.data,
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[langgraph][test] failed to run stream', error);

    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
