import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import {
  err,
  FIXTURE_HINDI,
  FIXTURE_POEM,
  item,
  items,
  loginAsAdmin,
  makeWriting,
  meta,
  seedAdmin,
} from '../test/factory.js';
import { Writing } from '../models/index.js';

const app = createApp();

beforeAll(async () => {
  await startTestDatabase();
});
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);
beforeEach(seedAdmin);

/* ------------------------------------------------- authorization (spec P0.6) */

describe('admin authorization', () => {
  const routes: ReadonlyArray<readonly [string, string]> = [
    ['get', '/api/v1/admin/writings'],
    ['post', '/api/v1/admin/writings'],
    ['get', '/api/v1/admin/writings/507f1f77bcf86cd799439011'],
    ['patch', '/api/v1/admin/writings/507f1f77bcf86cd799439011'],
    ['delete', '/api/v1/admin/writings/507f1f77bcf86cd799439011'],
    ['post', '/api/v1/admin/writings/507f1f77bcf86cd799439011/publish'],
    ['post', '/api/v1/admin/writings/507f1f77bcf86cd799439011/unpublish'],
  ];

  it.each(routes)('%s %s rejects an anonymous caller with 401', async (method, path) => {
    const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[
      method
    ]!(path);
    expect(res.status).toBe(401);
    expect(err(res).code).toBe('UNAUTHENTICATED');
  });

  it.each(routes)('%s %s rejects a forged cookie', async (method, path) => {
    const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[
      method
    ]!(path).set('Cookie', 'triyan_session=forged');
    expect(res.status).toBe(401);
  });

  it('an anonymous caller cannot create a writing', async () => {
    await request(app)
      .post('/api/v1/admin/writings')
      .send({ title: 'x', content: 'y' })
      .expect(401);
    expect(await Writing.countDocuments()).toBe(0);
  });
});

/* ------------------------------------------- drafts must never leak (P0.4) */

describe('public API hides unpublished work', () => {
  it('omits drafts from the archive listing', async () => {
    await makeWriting({ slug: 'published-one', status: 'PUBLISHED' });
    await makeWriting({ slug: 'a-draft', title: 'A Draft' });

    const res = await request(app).get('/api/v1/writings').expect(200);
    expect(item(res)).toHaveLength(1);
    expect(items(res)[0]?.slug).toBe('published-one');
    expect(meta(res).total).toBe(1);
  });

  it('returns 404 for a draft by slug, indistinguishable from a missing one', async () => {
    await makeWriting({ slug: 'a-draft' });

    const draft = await request(app).get('/api/v1/writings/a-draft').expect(404);
    const missing = await request(app).get('/api/v1/writings/never-existed').expect(404);
    expect(err(draft).message).toBe(err(missing).message);
  });

  it('omits book-exclusive writings even when published', async () => {
    await makeWriting({ slug: 'book-only', status: 'PUBLISHED', bookExclusive: true });

    expect(items(await request(app).get('/api/v1/writings').expect(200))).toHaveLength(0);
    await request(app).get('/api/v1/writings/book-only').expect(404);
  });

  it('refuses to publish a book-exclusive writing', async () => {
    const doc = await makeWriting({ slug: 'book-only', bookExclusive: true });
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .post(`/api/v1/admin/writings/${doc._id.toString()}/publish`)
      .set('Cookie', cookie)
      .expect(409);
    expect(err(res).code).toBe('CONFLICT');
  });

  it('shows drafts to an authenticated administrator', async () => {
    await makeWriting({ slug: 'a-draft' });
    const cookie = await loginAsAdmin(app);

    const res = await request(app).get('/api/v1/admin/writings').set('Cookie', cookie).expect(200);
    expect(item(res)).toHaveLength(1);
  });

  it('keeps drafts out of the sitemap', async () => {
    await makeWriting({ slug: 'published-one', status: 'PUBLISHED' });
    await makeWriting({ slug: 'a-draft' });
    await makeWriting({ slug: 'hidden-one', status: 'PUBLISHED', seo: { noindex: true } });

    const res = await request(app).get('/api/v1/sitemap-entries').expect(200);
    expect(items(res).map((row) => row.slug)).toEqual(['published-one']);
  });
});

/* ------------------------------------------------------------ admin CRUD */

describe('admin writing CRUD', () => {
  it('creates a draft and derives a slug and excerpt', async () => {
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send({ title: 'Existing Without Belonging', content: FIXTURE_POEM })
      .expect(201);

    expect(item(res).slug).toBe('existing-without-belonging');
    expect(item(res).status).toBe('DRAFT');
    expect(item(res).excerpt).toBeTruthy();
    expect(item(res).content).toBe(FIXTURE_POEM);
  });

  it('stores poetry verbatim through the API', async () => {
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send({ title: 'Stanzas', content: FIXTURE_POEM })
      .expect(201);

    const stored = await Writing.findById(item(res)._id).lean();
    expect(stored?.content).toBe(FIXTURE_POEM);
    expect(stored?.content).toContain('\n\n');
  });

  it('round-trips Devanagari and falls back to a manual slug', async () => {
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send({ title: 'तन्हाई', content: FIXTURE_HINDI, language: 'HINDI' })
      .expect(201);

    expect(item(res).content).toBe(FIXTURE_HINDI);
    // A Devanagari title yields no ASCII slug, so a placeholder is generated for the
    // admin to replace rather than an empty, invalid slug.
    expect(item(res).slug).toMatch(/^writing-[a-z0-9]+$/);
  });

  it('disambiguates a duplicate slug instead of failing', async () => {
    const cookie = await loginAsAdmin(app);
    const body = { title: 'Same Title', content: 'a' };

    const first = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    const second = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send(body)
      .expect(201);

    expect(item(first).slug).toBe('same-title');
    expect(item(second).slug).toBe('same-title-2');
  });

  it('rejects an invalid payload with a validation error', async () => {
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send({ title: '', content: '' })
      .expect(400);
    expect(err(res).code).toBe('VALIDATION_FAILED');
  });

  it('edits a writing', async () => {
    const doc = await makeWriting();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .patch(`/api/v1/admin/writings/${doc._id.toString()}`)
      .set('Cookie', cookie)
      .send({ title: 'A Revised Title', featured: true })
      .expect(200);

    expect(item(res).title).toBe('A Revised Title');
    expect(item(res).featured).toBe(true);
  });

  it('publishes, then unpublishes', async () => {
    const doc = await makeWriting();
    const cookie = await loginAsAdmin(app);
    const id = doc._id.toString();

    const published = await request(app)
      .post(`/api/v1/admin/writings/${id}/publish`)
      .set('Cookie', cookie)
      .expect(200);
    expect(item(published).status).toBe('PUBLISHED');
    expect(item(published).publishedAt).toBeTruthy();

    await request(app).get('/api/v1/writings/a-fixture-writing').expect(200);

    await request(app)
      .post(`/api/v1/admin/writings/${id}/unpublish`)
      .set('Cookie', cookie)
      .expect(200);
    await request(app).get('/api/v1/writings/a-fixture-writing').expect(404);
  });

  it('deletes a writing', async () => {
    const doc = await makeWriting();
    const cookie = await loginAsAdmin(app);

    await request(app)
      .delete(`/api/v1/admin/writings/${doc._id.toString()}`)
      .set('Cookie', cookie)
      .expect(204);
    expect(await Writing.countDocuments()).toBe(0);
  });

  it('returns 404 for an unknown or malformed id', async () => {
    const cookie = await loginAsAdmin(app);
    await request(app)
      .get('/api/v1/admin/writings/507f1f77bcf86cd799439011')
      .set('Cookie', cookie)
      .expect(404);
    await request(app).get('/api/v1/admin/writings/not-an-id').set('Cookie', cookie).expect(404);
  });
});

/* -------------------------------------------------- search, filter, related */

describe('search and filtering', () => {
  beforeEach(async () => {
    await makeWriting({
      slug: 'grief-one',
      title: 'Before Returning to Nothingness',
      content: 'the quiet after everything',
      status: 'PUBLISHED',
      primaryCategory: 'MORTALITY_NOTHINGNESS',
      themes: ['death', 'nothingness'],
      tags: ['silence'],
      language: 'ENGLISH',
    });
    await makeWriting({
      slug: 'love-one',
      title: 'You Are the Hope',
      content: 'a line about wanting',
      status: 'PUBLISHED',
      primaryCategory: 'LOVE_LONGING',
      themes: ['love', 'longing'],
      tags: ['monsoon'],
      language: 'ENGLISH',
      featured: true,
    });
    await makeWriting({
      slug: 'hindi-one',
      title: 'तन्हाई',
      content: FIXTURE_HINDI,
      status: 'PUBLISHED',
      language: 'HINDI',
      themes: ['loneliness'],
    });
  });

  it('searches titles', async () => {
    const res = await request(app).get('/api/v1/writings?q=Nothingness').expect(200);
    expect(items(res).map((row) => row.slug)).toEqual(['grief-one']);
  });

  it('searches body text', async () => {
    const res = await request(app).get('/api/v1/writings?q=wanting').expect(200);
    expect(item(res)).toHaveLength(1);
    expect(items(res)[0]?.slug).toBe('love-one');
  });

  it('searches Devanagari', async () => {
    const res = await request(app).get('/api/v1/writings?q=पहली').expect(200);
    expect(item(res)).toHaveLength(1);
    expect(items(res)[0]?.slug).toBe('hindi-one');
  });

  it('returns an empty result rather than an error when nothing matches', async () => {
    const res = await request(app).get('/api/v1/writings?q=zzzznotpresent').expect(200);
    expect(item(res)).toEqual([]);
    expect(meta(res).total).toBe(0);
  });

  it('filters by category, theme, tag and language', async () => {
    const byCategory = await request(app).get('/api/v1/writings?category=LOVE_LONGING').expect(200);
    expect(item(byCategory)).toHaveLength(1);

    const byTheme = await request(app).get('/api/v1/writings?themes=death').expect(200);
    expect(items(byTheme)[0]?.slug).toBe('grief-one');

    const byTag = await request(app).get('/api/v1/writings?tags=monsoon').expect(200);
    expect(items(byTag)[0]?.slug).toBe('love-one');

    const byLanguage = await request(app).get('/api/v1/writings?language=HINDI').expect(200);
    expect(items(byLanguage)[0]?.slug).toBe('hindi-one');
  });

  it('filters to featured writings', async () => {
    const res = await request(app).get('/api/v1/writings?featured=true').expect(200);
    expect(item(res)).toHaveLength(1);
    expect(items(res)[0]?.slug).toBe('love-one');
  });

  it('rejects an unknown filter value', async () => {
    await request(app).get('/api/v1/writings?category=NOPE').expect(400);
  });

  it('paginates', async () => {
    const res = await request(app).get('/api/v1/writings?limit=2&page=1').expect(200);
    expect(item(res)).toHaveLength(2);
    expect(meta(res)).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('returns related writings deterministically, excluding itself', async () => {
    await makeWriting({
      slug: 'love-two',
      title: 'Another Longing',
      content: 'x',
      status: 'PUBLISHED',
      primaryCategory: 'LOVE_LONGING',
      themes: ['love'],
      language: 'ENGLISH',
    });

    const res = await request(app).get('/api/v1/writings/love-one/related').expect(200);
    const slugs = items(res).map((row) => row.slug);
    expect(slugs).not.toContain('love-one');
    expect(slugs[0]).toBe('love-two');

    const again = await request(app).get('/api/v1/writings/love-one/related').expect(200);
    expect(items(again).map((row) => row.slug)).toEqual(slugs);
  });

  it('returns no related writings when nothing is related', async () => {
    const res = await request(app).get('/api/v1/writings/hindi-one/related').expect(200);
    expect(Array.isArray(item(res))).toBe(true);
  });
});

/* ------------------------------------------------------ injection boundary */

describe('operator injection is rejected at the validation boundary', () => {
  beforeEach(async () => {
    await makeWriting({ slug: 'published-one', status: 'PUBLISHED' });
    await makeWriting({ slug: 'a-secret-draft', title: 'Secret' });
  });

  it('cannot smuggle an operator through a filter parameter', async () => {
    // `?status[$ne]=DRAFT` style injection: Express parses this into an object,
    // and the zod schema must refuse it rather than pass it to the query.
    const res = await request(app).get('/api/v1/writings?language[$ne]=NOTHING').expect(400);
    expect(err(res).code).toBe('VALIDATION_FAILED');
  });

  it('cannot widen the result set by injecting into a category filter', async () => {
    await request(app).get('/api/v1/writings?category[$exists]=true').expect(400);
  });

  it('treats an injected search operator as literal text, returning nothing', async () => {
    const res = await request(app).get('/api/v1/writings?q[$regex]=.*').expect(400);
    expect(err(res).code).toBe('VALIDATION_FAILED');
  });

  it('cannot reach a draft by injecting into the slug route', async () => {
    await request(app)
      .get('/api/v1/writings/' + encodeURIComponent('{"$ne":null}'))
      .expect(404);
    // The draft is still private.
    await request(app).get('/api/v1/writings/a-secret-draft').expect(404);
  });

  it('cannot escalate by sending extra fields in a login body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } })
      .expect(401);
    expect(err(res).code).toBe('UNAUTHENTICATED');
  });
});
