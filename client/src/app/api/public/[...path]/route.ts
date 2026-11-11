import type { NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

/**
 * Same-origin proxy for the handful of public endpoints the browser posts to.
 *
 * Only POST is forwarded, and only to an allow-listed path: a general-purpose proxy
 * on a public route would let anyone use this origin to reach arbitrary API paths.
 */
const ALLOWED = new Set(['contact', 'waitlist']);

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join('/');

  if (!ALLOWED.has(target)) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'No such endpoint' } },
      { status: 404 },
    );
  }

  const { API_BASE_URL } = serverEnv();

  try {
    const upstream = await fetch(`${API_BASE_URL}/api/v1/${target}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Preserve the caller's address so the API's rate limiter sees the reader,
        // not this server.
        ...(req.headers.get('x-forwarded-for')
          ? { 'x-forwarded-for': req.headers.get('x-forwarded-for') as string }
          : {}),
      },
      body: await req.text(),
      cache: 'no-store',
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  } catch {
    return Response.json(
      { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'The message could not be sent' } },
      { status: 503 },
    );
  }
}
