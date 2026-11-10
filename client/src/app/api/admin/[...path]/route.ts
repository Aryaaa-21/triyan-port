import type { NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

/**
 * First-party proxy to the Express API for all admin traffic.
 *
 * The client runs on Vercel and the API on Railway, which are different sites. A
 * session cookie set directly by the API would therefore need `SameSite=None`,
 * weakening CSRF protection for the one surface that must not be weak. Proxying the
 * admin API through this origin keeps the cookie first-party and `SameSite=Lax`.
 */

export const dynamic = 'force-dynamic';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

const proxy = async (req: NextRequest, path: string[]): Promise<Response> => {
  const { API_BASE_URL } = serverEnv();
  const search = req.nextUrl.search;
  const target = `${API_BASE_URL}/api/v1/${path.map(encodeURIComponent).join('/')}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      ...(hasBody ? { body: await req.text() } : {}),
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json(
      { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'The API is not reachable' } },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  // Cookies must survive the hop, which `Headers.forEach` would otherwise flatten.
  const setCookie = upstream.headers.getSetCookie?.() ?? [];
  responseHeaders.delete('set-cookie');
  for (const cookie of setCookie) responseHeaders.append('set-cookie', cookie);
  responseHeaders.set('cache-control', 'no-store');

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
