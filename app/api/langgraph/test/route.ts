import { NextResponse } from 'next/server';

const DEFAULT_TOPIC = 'social media marketing strategy for AI startups';
const API_BASE = (process.env.LANGGRAPH_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const topic: string =
    typeof body?.topic === 'string' && body.topic.trim().length > 0
      ? body.topic.trim()
      : DEFAULT_TOPIC;

  try {
    const upstream = await fetch(`${API_BASE}/research/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = typeof (data as any)?.detail === 'string' ? (data as any).detail : JSON.stringify(data);
      console.error('[langgraph][test] upstream error', upstream.status, message);
      return NextResponse.json({ error: message || 'Upstream error' }, { status: upstream.status });
    }

    // Pass-through upstream JSON; client can handle both direct JSON or events[]
    return NextResponse.json(data);
  } catch (error) {
    console.error('[langgraph][test] failed to run stream', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
