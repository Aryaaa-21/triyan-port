import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import { err, item, items, loginAsAdmin, seedAdmin } from '../test/factory.js';
import { InstagramMedia } from '../models/index.js';
import {
  buildMockMedia,
  createMockProvider,
  setInstagramProvider,
} from '../services/instagram/index.js';
import { runSync } from '../services/instagram/sync.service.js';
import type { InstagramMediaDto, SyncStatusDto } from '@triyan/shared';

const app = createApp();

beforeAll(startTestDatabase);
afterEach(async () => {
  setInstagramProvider(null);
  await clearTestDatabase();
});
afterAll(stopTestDatabase);

const syncSome = async (n = 30) => {
  const provider = createMockProvider({ items: buildMockMedia(n) });
  setInstagramProvider(provider);
  await runSync({ mode: 'FULL', provider, sleep: () => Promise.resolve() });
  return provider;
};

type Meta = { nextCursor: string | null; hasMore: boolean; limit: number };
const metaOf = (res: { body: unknown }) => (res.body as { meta: Meta }).meta;

describe('public instagram API', () => {
  it('returns an empty list, not an error, before any sync', async () => {
    const res = await request(app).get('/api/v1/instagram').expect(200);
    expect(items(res)).toEqual([]);
  });

  it('lists every accessible post through cursor pagination, newest first', async () => {
    await syncSome(30);
    const seen: string[] = [];
    let cursor: string | null = null;
    let guard = 0;
    do {
      const res: request.Response = await request(app)
        .get('/api/v1/instagram')
        .query({ limit: 7, ...(cursor ? { cursor } : {}) })
        .expect(200);
      const page = items<InstagramMediaDto>(res);
      seen.push(...page.map((p) => p.sourceId));
      cursor = metaOf(res).nextCursor;
      guard += 1;
    } while (cursor && guard < 10);
    expect(seen).toHaveLength(30);
    expect(new Set(seen).size).toBe(30);
    expect(seen[0]).toBe('mock_0030');
  });

  it('hides hidden and unavailable posts', async () => {
    await syncSome(5);
    await InstagramMedia.updateOne({ sourceId: 'mock_0005' }, { hidden: true });
    await InstagramMedia.updateOne({ sourceId: 'mock_0004' }, { available: false });
    const res = await request(app).get('/api/v1/instagram').expect(200);
    const ids = items<InstagramMediaDto>(res).map((p) => p.sourceId);
    expect(ids).not.toContain('mock_0005');
    expect(ids).not.toContain('mock_0004');
    expect(ids).toHaveLength(3);
  });

  it('filters by category and language', async () => {
    await syncSome(30);
    const hindi = items<InstagramMediaDto>(
      await request(app)
        .get('/api/v1/instagram')
        .query({ language: 'HINDI', limit: 60 })
        .expect(200),
    );
    expect(hindi.length).toBeGreaterThan(0);
    expect(hindi.every((p) => p.classification.language === 'HINDI')).toBe(true);

    const grief = items<InstagramMediaDto>(
      await request(app)
        .get('/api/v1/instagram')
        .query({ category: 'GRIEF_MELANCHOLY', limit: 60 })
        .expect(200),
    );
    expect(grief.length).toBeGreaterThan(0);
  });

  it('filters reels', async () => {
    await syncSome(12);
    const reels = items<InstagramMediaDto>(
      await request(app).get('/api/v1/instagram').query({ productType: 'REELS' }).expect(200),
    );
    expect(reels.length).toBe(3);
  });

  it('serves a single post with its original link and related posts', async () => {
    await syncSome(10);
    const [first] = items<InstagramMediaDto>(
      await request(app).get('/api/v1/instagram').expect(200),
    );
    if (!first) throw new Error('no post');
    const res = await request(app).get(`/api/v1/instagram/${first._id}`).expect(200);
    expect(item<InstagramMediaDto>(res).permalink).toMatch(/^https:\/\/www\.instagram\.com\//);
    expect(Array.isArray((res.body as { meta: { related: unknown[] } }).meta.related)).toBe(true);
    expect(Object.keys(item<object>(res))).not.toContain('corrections');
  });

  it('404s a malformed or hidden id', async () => {
    await request(app).get('/api/v1/instagram/not-an-id').expect(404);
    await syncSome(2);
    const doc = await InstagramMedia.findOneAndUpdate(
      {},
      { hidden: true },
      { returnDocument: 'after' },
    );
    await request(app)
      .get(`/api/v1/instagram/${String(doc?._id)}`)
      .expect(404);
  });
});

describe('admin instagram API', () => {
  let cookie = '';
  beforeEach(async () => {
    await seedAdmin();
    cookie = await loginAsAdmin(app);
  });

  it('rejects every admin route without a session', async () => {
    const id = '0123456789abcdef01234567';
    await request(app).get('/api/v1/admin/instagram').expect(401);
    await request(app).get('/api/v1/admin/instagram/sync').expect(401);
    await request(app).post('/api/v1/admin/instagram/sync').expect(401);
    await request(app).post('/api/v1/admin/instagram/reclassify').expect(401);
    await request(app).patch(`/api/v1/admin/instagram/${id}`).expect(401);
    await request(app).post(`/api/v1/admin/instagram/${id}/classification`).expect(401);
    await request(app).post(`/api/v1/admin/instagram/${id}/refresh`).expect(401);
  });

  it('syncs on demand and reports status', async () => {
    setInstagramProvider(createMockProvider({ items: buildMockMedia(8) }));
    const res = await request(app)
      .post('/api/v1/admin/instagram/sync')
      .set('Cookie', cookie)
      .send({ mode: 'FULL' })
      .expect(200);
    expect(item<{ created: number }>(res).created).toBe(8);
    const status = item<SyncStatusDto>(
      await request(app).get('/api/v1/admin/instagram/sync').set('Cookie', cookie).expect(200),
    );
    expect(status).toMatchObject({ health: 'HEALTHY', totalStored: 8, provider: 'mock' });
    expect(status.lastRun?.created).toBe(8);
  });

  it('returns 503 with a clear message when credentials are missing', async () => {
    setInstagramProvider(createMockProvider({ configured: false }));
    const res = await request(app)
      .post('/api/v1/admin/instagram/sync')
      .set('Cookie', cookie)
      .send({})
      .expect(503);
    expect(err(res).message).toMatch(/credentials/i);
  });

  it('features and hides a post', async () => {
    await syncSome(3);
    const doc = await InstagramMedia.findOne({ sourceId: 'mock_0001' });
    const res = await request(app)
      .patch(`/api/v1/admin/instagram/${String(doc?._id)}`)
      .set('Cookie', cookie)
      .send({ featured: true, hidden: true })
      .expect(200);
    expect(item<InstagramMediaDto>(res)).toMatchObject({ featured: true, hidden: true });
  });

  it('corrects a classification, records it, and reclassify leaves it alone', async () => {
    await syncSome(3);
    const doc = await InstagramMedia.findOne({ sourceId: 'mock_0001' });
    const id = String(doc?._id);
    const res = await request(app)
      .post(`/api/v1/admin/instagram/${id}/classification`)
      .set('Cookie', cookie)
      .send({ primaryCategory: 'HOPE_DESPAIR', themes: ['hope'], emotions: ['hope'], note: 'fix' })
      .expect(200);
    const fixed = item<InstagramMediaDto>(res);
    expect(fixed.classification).toMatchObject({
      primaryCategory: 'HOPE_DESPAIR',
      method: 'MANUAL',
      needsReview: false,
    });
    expect(fixed.manualOverride).toBe(true);
    const stored = await InstagramMedia.findById(id).lean();
    expect(stored?.corrections).toHaveLength(1);

    await request(app)
      .post('/api/v1/admin/instagram/reclassify')
      .set('Cookie', cookie)
      .send({ confirm: true, scope: 'ALL' })
      .expect(200);
    expect((await InstagramMedia.findById(id).lean())?.classification?.primaryCategory).toBe(
      'HOPE_DESPAIR',
    );
  });

  it('requires explicit confirmation to reclassify', async () => {
    await request(app)
      .post('/api/v1/admin/instagram/reclassify')
      .set('Cookie', cookie)
      .send({ scope: 'ALL' })
      .expect(400);
  });

  it('rejects an invalid category correction', async () => {
    await syncSome(1);
    const doc = await InstagramMedia.findOne();
    await request(app)
      .post(`/api/v1/admin/instagram/${String(doc?._id)}/classification`)
      .set('Cookie', cookie)
      .send({ primaryCategory: 'NOT_A_CATEGORY' })
      .expect(400);
  });

  it('refreshes metadata and marks a deleted post unavailable', async () => {
    const provider = await syncSome(3);
    const doc = await InstagramMedia.findOne({ sourceId: 'mock_0002' });
    provider.items = provider.items.filter((i) => i.sourceId !== 'mock_0002');
    const res = await request(app)
      .post(`/api/v1/admin/instagram/${String(doc?._id)}/refresh`)
      .set('Cookie', cookie)
      .expect(200);
    expect(item<InstagramMediaDto>(res).available).toBe(false);
  });

  it('lists the review queue', async () => {
    await syncSome(10);
    const res = await request(app)
      .get('/api/v1/admin/instagram')
      .query({ needsReview: 'true', limit: 60 })
      .set('Cookie', cookie)
      .expect(200);
    expect(items<InstagramMediaDto>(res).every((p) => p.classification.needsReview)).toBe(true);
  });
});
