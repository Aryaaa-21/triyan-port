/**
 * `api.ts` is a server-only module (it refuses to run in the browser), so this suite
 * runs under node rather than the project's default DOM environment.
 *
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, CACHE_TAGS, apiFetch } from './api.js';

const mockFetch = (body: unknown, init: { status?: number } = {}) => {
  const spy = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', spy);
  return spy;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('returns the response envelope', async () => {
    mockFetch({ data: { version: 'v1' } });
    const result = await apiFetch<{ version: string }>('/api/v1');
    expect(result.data.version).toBe('v1');
  });

  it('passes cache tags through to the fetch cache', async () => {
    const spy = mockFetch({ data: [] });
    await apiFetch('/api/v1/writings', { tags: [CACHE_TAGS.writings], revalidate: 60 });
    const init = spy.mock.calls[0]?.[1] as { next?: { tags?: string[]; revalidate?: number } };
    expect(init.next).toMatchObject({ tags: ['writings'], revalidate: 60 });
  });

  it('never caches a mutation', async () => {
    const spy = mockFetch({ data: {} });
    await apiFetch('/api/v1/waitlist', { method: 'POST', body: { email: 'a@b.co' } });
    const init = spy.mock.calls[0]?.[1] as { cache?: string; next?: unknown };
    expect(init.cache).toBe('no-store');
    expect(init.next).toBeUndefined();
  });

  it('translates an api error envelope into an ApiError', async () => {
    mockFetch({ error: { code: 'NOT_FOUND', message: 'No such writing' } }, { status: 404 });
    await expect(apiFetch('/api/v1/writings/nope')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'NOT_FOUND',
      message: 'No such writing',
    });
  });

  it('survives a non-json error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>502</html>', { status: 502 })),
    );
    await expect(apiFetch('/api/v1')).rejects.toBeInstanceOf(ApiError);
  });
});
