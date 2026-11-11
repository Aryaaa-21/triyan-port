import { describe, expect, it } from 'vitest';
import { classifyGraphError, createGraphProvider } from './graph.provider.js';
import { ProviderError } from './provider.js';

const reply = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: () => Promise.resolve(body),
  });

const raw = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  caption: `c ${id}`,
  media_type: 'IMAGE',
  media_product_type: 'FEED',
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: '2025-01-01T00:00:00+0000',
  ...extra,
});

describe('graph provider', () => {
  it('reports unconfigured and refuses to call out without a token', async () => {
    let called = false;
    const p = createGraphProvider(undefined, () => {
      called = true;
      return reply(200, {});
    });
    expect(p.configured).toBe(false);
    await expect(p.fetchPage(null, 10)).rejects.toMatchObject({ kind: 'MISSING_CREDENTIALS' });
    expect(called).toBe(false);
  });

  it('calls the official endpoint and maps media, including reels and carousels', async () => {
    const urls: string[] = [];
    const p = createGraphProvider('tok', (url) => {
      urls.push(url);
      return reply(200, {
        data: [
          raw('1', { media_type: 'VIDEO', media_product_type: 'REELS', thumbnail_url: 't' }),
          raw('2', {
            media_type: 'CAROUSEL_ALBUM',
            children: { data: [{ media_type: 'IMAGE', media_url: 'u' }] },
          }),
        ],
        paging: { cursors: { after: 'AFTER' }, next: 'https://next' },
      });
    });
    const page = await p.fetchPage(null, 25);
    expect(urls[0]).toMatch(/^https:\/\/graph\.instagram\.com\/v\d+\.0\/me\/media\?/);
    expect(urls[0]).toContain('limit=25');
    expect(page.items[0]).toMatchObject({
      productType: 'REELS',
      mediaType: 'VIDEO',
      thumbnailUrl: 't',
    });
    expect(page.items[1]?.children).toHaveLength(1);
    expect(page.nextCursor).toBe('AFTER');
  });

  it('passes the cursor and ends when there is no next page', async () => {
    const urls: string[] = [];
    const p = createGraphProvider('tok', (url) => {
      urls.push(url);
      return reply(200, { data: [raw('3')], paging: { cursors: { after: 'X' } } });
    });
    const page = await p.fetchPage('CUR', 10);
    expect(urls[0]).toContain('after=CUR');
    expect(page.nextCursor).toBeNull();
  });

  it('skips malformed items instead of failing the page', async () => {
    const p = createGraphProvider('tok', () =>
      reply(200, { data: [raw('ok'), { caption: 'no id' }, raw('bad', { timestamp: 'nope' })] }),
    );
    const page = await p.fetchPage(null, 10);
    expect(page.items.map((i) => i.sourceId)).toEqual(['ok']);
  });

  it('treats a network failure as transient', async () => {
    const p = createGraphProvider('tok', () => Promise.reject(new Error('ECONNRESET')));
    const error = await p.fetchPage(null, 10).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).transient).toBe(true);
  });
});

describe('classifyGraphError', () => {
  it('maps an expired token', () => {
    expect(classifyGraphError(400, { error: { code: 190, error_subcode: 463 } }, null).kind).toBe(
      'TOKEN_EXPIRED',
    );
  });
  it('maps an invalid token', () => {
    expect(classifyGraphError(400, { error: { code: 190 } }, null).kind).toBe('INVALID_TOKEN');
  });
  it('maps rate limits with retry-after', () => {
    const e = classifyGraphError(429, {}, '120');
    expect(e.kind).toBe('RATE_LIMITED');
    expect(e.retryAfterMs).toBe(120_000);
    expect(classifyGraphError(400, { error: { code: 4 } }, null).kind).toBe('RATE_LIMITED');
  });
  it('maps missing media', () => {
    expect(classifyGraphError(404, {}, null).kind).toBe('NOT_FOUND');
  });
  it('maps server errors to unavailable', () => {
    expect(classifyGraphError(503, null, null).kind).toBe('UNAVAILABLE');
  });
});
