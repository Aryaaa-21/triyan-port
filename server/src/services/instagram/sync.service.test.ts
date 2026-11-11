import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../test/db.js';
import { InstagramMedia, InstagramSyncState } from '../../models/index.js';
import { buildMockMedia, createMockProvider } from './mock.provider.js';
import { ProviderError } from './provider.js';
import { runSync } from './sync.service.js';

beforeAll(startTestDatabase);
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);

const noSleep = () => Promise.resolve();
const state = () => InstagramSyncState.findOne({ key: 'instagram' }).lean();

describe('runSync', () => {
  it('performs an initial full sync across every page', async () => {
    const provider = createMockProvider({ items: buildMockMedia(23) });
    const r = await runSync({ mode: 'FULL', provider, pageSize: 5, sleep: noSleep });
    expect(r).toMatchObject({ status: 'COMPLETED', fetched: 23, created: 23, pages: 5 });
    expect(await InstagramMedia.countDocuments()).toBe(23);
    expect((await state())?.health).toBe('HEALTHY');
  });

  it('classifies every stored post', async () => {
    await runSync({
      mode: 'FULL',
      provider: createMockProvider({ items: buildMockMedia(10) }),
      sleep: noSleep,
    });
    const docs = await InstagramMedia.find().lean();
    expect(docs.every((d) => d.classification?.classifierVersion?.startsWith('rules'))).toBe(true);
    expect(docs.some((d) => d.classification?.primaryCategory)).toBe(true);
    expect(docs.some((d) => d.classification?.language === 'HINDI')).toBe(true);
  });

  it('deduplicates: a second sync creates nothing', async () => {
    const provider = createMockProvider({ items: buildMockMedia(12) });
    await runSync({ mode: 'FULL', provider, pageSize: 5, sleep: noSleep });
    const r = await runSync({ mode: 'FULL', provider, pageSize: 5, sleep: noSleep });
    expect(r.created).toBe(0);
    expect(r.unchanged).toBe(12);
    expect(await InstagramMedia.countDocuments()).toBe(12);
  });

  it('incremental sync fetches only new posts and stops at known ones', async () => {
    const all = buildMockMedia(40);
    const provider = createMockProvider({ items: all.slice(5) });
    await runSync({ mode: 'FULL', provider, pageSize: 5, sleep: noSleep });
    provider.items = all;
    const r = await runSync({ mode: 'INCREMENTAL', provider, pageSize: 5, sleep: noSleep });
    expect(r.mode).toBe('INCREMENTAL');
    expect(r.created).toBe(5);
    expect(r.pages).toBeLessThanOrEqual(2);
    expect(await InstagramMedia.countDocuments()).toBe(40);
  });

  it('treats incremental with no history as full', async () => {
    const r = await runSync({
      mode: 'INCREMENTAL',
      provider: createMockProvider({ items: buildMockMedia(7) }),
      sleep: noSleep,
    });
    expect(r.mode).toBe('FULL');
    expect(r.created).toBe(7);
  });

  it('retries transient failures', async () => {
    const provider = createMockProvider({
      items: buildMockMedia(3),
      failOn: { call: 1, error: new ProviderError('UNAVAILABLE', 'blip') },
    });
    const r = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(r.status).toBe('COMPLETED');
    expect(r.created).toBe(3);
  });

  it('checkpoints and resumes an interrupted full sync', async () => {
    const items = buildMockMedia(20);
    const failing = createMockProvider({
      items,
      failOn: { call: 3, error: new ProviderError('TOKEN_EXPIRED', 'expired') },
    });
    const first = await runSync({ mode: 'FULL', provider: failing, pageSize: 5, sleep: noSleep });
    expect(first.status).toBe('PARTIAL');
    expect(first.created).toBe(10);
    const s = await state();
    expect(s?.health).toBe('TOKEN_EXPIRED');
    expect(s?.resumeCursor).toBe('10');

    const resumed = await runSync({
      mode: 'FULL',
      provider: createMockProvider({ items }),
      pageSize: 5,
      sleep: noSleep,
    });
    expect(resumed.status).toBe('COMPLETED');
    expect(resumed.created).toBe(10);
    expect(resumed.pages).toBe(2);
    expect(resumed.markedUnavailable).toBe(0);
    expect((await state())?.resumeCursor).toBeNull();
  });

  it('records rate limits and skips until the window passes', async () => {
    const provider = createMockProvider({
      items: buildMockMedia(3),
      failOn: { call: 1, error: new ProviderError('RATE_LIMITED', 'slow down', 60_000) },
    });
    const r = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(r).toMatchObject({ status: 'FAILED', reason: 'RATE_LIMITED' });
    expect((await state())?.rateLimitedUntil).toBeTruthy();
    const again = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(again).toMatchObject({ status: 'SKIPPED', reason: 'RATE_LIMITED' });
  });

  it('records an invalid token as a failure without crashing', async () => {
    const provider = createMockProvider({
      failOn: { call: 1, error: new ProviderError('INVALID_TOKEN', 'bad') },
    });
    const r = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(r.status).toBe('FAILED');
    const s = await state();
    expect(s?.health).toBe('FAILED');
    expect(s?.lastError).toContain('INVALID_TOKEN');
    expect(s?.lockedUntil).toBeNull();
  });

  it('refuses to run without credentials', async () => {
    const r = await runSync({ mode: 'FULL', provider: createMockProvider({ configured: false }) });
    expect(r).toMatchObject({ status: 'SKIPPED', reason: 'MISSING_CREDENTIALS' });
    expect(await InstagramMedia.countDocuments()).toBe(0);
  });

  it('does not run two syncs at once', async () => {
    await InstagramSyncState.create({
      key: 'instagram',
      lockedUntil: new Date(Date.now() + 60_000),
    });
    const r = await runSync({ mode: 'FULL', provider: createMockProvider() });
    expect(r).toMatchObject({ status: 'SKIPPED', reason: 'LOCKED' });
  });

  it('marks deleted posts unavailable rather than destroying them', async () => {
    const items = buildMockMedia(6);
    const provider = createMockProvider({ items });
    await runSync({ mode: 'FULL', provider, sleep: noSleep });
    provider.items = items.slice(1);
    const r = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(r.markedUnavailable).toBe(1);
    const gone = await InstagramMedia.findOne({ sourceId: items[0]?.sourceId }).lean();
    expect(gone?.available).toBe(false);
    expect(await InstagramMedia.countDocuments()).toBe(6);

    provider.items = items;
    await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect((await InstagramMedia.findOne({ sourceId: items[0]?.sourceId }).lean())?.available).toBe(
      true,
    );
  });

  it('updates an edited caption and reclassifies it, unless an admin overrode it', async () => {
    const items = buildMockMedia(2);
    const provider = createMockProvider({ items });
    await runSync({ mode: 'FULL', provider, sleep: noSleep });
    const [a, b] = items;
    if (!a || !b) throw new Error('fixture');
    await InstagramMedia.updateOne(
      { sourceId: b.sourceId },
      { manualOverride: true, 'classification.primaryCategory': 'HOPE_DESPAIR' },
    );
    provider.items = [
      { ...a, caption: '[mock] grief grief mourning' },
      { ...b, caption: '[mock] grief grief mourning' },
    ];
    const r = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(r.updated).toBe(2);
    expect(
      (await InstagramMedia.findOne({ sourceId: a.sourceId }).lean())?.classification
        ?.primaryCategory,
    ).toBe('GRIEF_MELANCHOLY');
    expect(
      (await InstagramMedia.findOne({ sourceId: b.sourceId }).lean())?.classification
        ?.primaryCategory,
    ).toBe('HOPE_DESPAIR');
  });

  it('stores empty and malformed captions safely', async () => {
    const [base] = buildMockMedia(1);
    if (!base) throw new Error('fixture');
    const provider = createMockProvider({
      items: [
        { ...base, sourceId: 'empty', caption: '' },
        { ...base, sourceId: 'weird', caption: '\u0000� 🖤🖤 ####' },
      ],
    });
    const r = await runSync({ mode: 'FULL', provider, sleep: noSleep });
    expect(r.created).toBe(2);
    const empty = await InstagramMedia.findOne({ sourceId: 'empty' }).lean();
    expect(empty?.classification?.needsReview).toBe(true);
  });
});
