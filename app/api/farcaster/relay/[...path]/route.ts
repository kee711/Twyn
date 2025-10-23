import { NextResponse } from 'next/server';

const RELAY_BASE = (process.env.FARCASTER_RELAY_ORIGIN || process.env.NEXT_PUBLIC_FARCASTER_RELAY_ORIGIN || 'https://relay.farcaster.xyz').replace(/\/+$/, '');
const RELAY_API_KEY = process.env.FARCASTER_API_KEY || process.env.NEXT_PUBLIC_FARCASTER_RELAY_API_KEY || '';

async function proxyRequest(request: Request, params: { path?: string[] }) {
  if (!RELAY_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Missing FARCASTER_API_KEY configuration' },
      { status: 500 },
    );
  }

  const targetPath = (params.path ?? []).join('/');
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${RELAY_BASE}/${targetPath}`);
  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers(request.headers);
  const hasAuthHeader = headers.has('authorization');

  if (!hasAuthHeader) {
    headers.set('Authorization', `Bearer ${RELAY_API_KEY}`);
  } else {
    headers.set('X-Api-Key', RELAY_API_KEY);
  }

  if (!targetUrl.searchParams.has('api_key')) {
    targetUrl.searchParams.set('api_key', RELAY_API_KEY);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    init.body = body;
  }

  try {
    const response = await fetch(targetUrl.toString(), init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('www-authenticate');

    const responseBody = await response.arrayBuffer();
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[farcaster relay proxy] request failed', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to reach Farcaster relay' },
      { status: 502 },
    );
  }
}

export function GET(request: Request, context: { params: { path?: string[] } }) {
  return proxyRequest(request, context.params ?? {});
}

export function POST(request: Request, context: { params: { path?: string[] } }) {
  return proxyRequest(request, context.params ?? {});
}

export function PUT(request: Request, context: { params: { path?: string[] } }) {
  return proxyRequest(request, context.params ?? {});
}

export function DELETE(request: Request, context: { params: { path?: string[] } }) {
  return proxyRequest(request, context.params ?? {});
}

export function OPTIONS(request: Request, context: { params: { path?: string[] } }) {
  return proxyRequest(request, context.params ?? {});
}
