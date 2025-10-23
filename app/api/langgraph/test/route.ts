import { NextResponse } from 'next/server';
import { Client } from '@langchain/langgraph-sdk';

type StreamMode = 'updates' | 'messages-tuple';

const DEFAULT_TOPIC = 'social media marketing strategy for AI startups';
const DEFAULT_GRAPH_ID = process.env.LANGGRAPH_GRAPH_ID || 'researcher';
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

  const input =
    body?.input && typeof body.input === 'object'
      ? body.input
      : { topic };

  try {
    const events: Array<{ event: string; data: unknown }> = [];

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
