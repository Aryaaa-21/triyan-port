import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './api';

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

  it('calls the API on the same origin, with the session cookie', async () => {
    const spy = mockFetch({ data: [] });
    await apiFetch('/api/v1/writings');
    expect(spy.mock.calls[0]?.[0]).toBe('/api/v1/writings');
    expect((spy.mock.calls[0]?.[1] as RequestInit).credentials).toBe('same-origin');
  });

  it('never caches a mutation', async () => {
    const spy = mockFetch({ data: {} });
    await apiFetch('/api/v1/contact', { method: 'POST', body: { a: 1 } });
    const init = spy.mock.calls[0]?.[1] as RequestInit;
    expect(init.cache).toBe('no-store');
    expect(init.body).toBe('{"a":1}');
  });

  it('turns an error envelope into an ApiError', async () => {
    mockFetch({ error: { code: 'NOT_FOUND', message: 'No such writing' } }, { status: 404 });
    await expect(apiFetch('/api/v1/writings/nope')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    await expect(apiFetch('/api/v1/writings/nope')).rejects.toBeInstanceOf(ApiError);
  });
});
