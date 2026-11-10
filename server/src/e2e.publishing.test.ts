/**
 * The workflow this whole phase exists to prove:
 *
 *   login -> create -> draft hidden -> edit -> preview -> publish -> public API
 *   -> shareable URL -> SEO fields -> related -> sitemap -> unpublish -> hidden
 *   -> delete -> gone
 *
 * Run against a real MongoDB and the real Express app. Each step asserts the
 * observable consequence, not just a 200.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './test/db.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD, err, item, items, seedAdmin } from './test/factory.js';
import type { WritingRow } from './test/factory.js';

const app = createApp();

/**
 * Obviously-synthetic fixture text. Triyan's actual poems are not in this repository
 * and are never invented; this exists only to prove the pipeline moves text intact.
 */
const FIXTURE = [
  'first line of the fixture',
  'second line, with a comma',
  '',
  '    an indented line after the stanza break',
  'and the last one — with an em dash…',
].join('\n');

let cookie = '';
let id = '';
let slug = '';

beforeAll(async () => {
  await startTestDatabase();
  await clearTestDatabase();
  await seedAdmin();
});
afterAll(stopTestDatabase);

describe('end-to-end publishing workflow', () => {
  it('1. an anonymous visitor cannot reach the admin API', async () => {
    const res = await request(app).get('/api/v1/admin/writings').expect(401);
    expect(err(res).code).toBe('UNAUTHENTICATED');
  });

  it('2. the administrator signs in', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    cookie = (setCookie.find((c) => c.startsWith('triyan_session=')) ?? '').split(';')[0] ?? '';
    expect(cookie).toContain('triyan_session=');
  });

  it('3. creates a writing, which starts as a draft', async () => {
    const res = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send({
        title: 'A Fixture For The Workflow',
        content: FIXTURE,
        language: 'ENGLISH',
        primaryCategory: 'ABSENCE_LOSS',
        themes: ['loss', 'memory'],
        emotions: ['melancholy'],
        tags: ['fixture'],
      })
      .expect(201);

    const created = item<WritingRow>(res);
    id = created._id;
    slug = created.slug;

    expect(created.status).toBe('DRAFT');
    expect(created.publishedAt).toBeNull();
    expect(slug).toBe('a-fixture-for-the-workflow');
  });

  it('4. the draft is invisible to the public, by listing and by slug', async () => {
    expect(items(await request(app).get('/api/v1/writings').expect(200))).toHaveLength(0);
    await request(app).get(`/api/v1/writings/${slug}`).expect(404);
  });

  it('5. the administrator edits the draft', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/writings/${id}`)
      .set('Cookie', cookie)
      .send({ title: 'Existing Without Belonging', featured: true })
      .expect(200);

    expect(item<WritingRow>(res).title).toBe('Existing Without Belonging');
  });

  it('6. previews it — the admin can read the draft that the public cannot', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/writings/${id}`)
      .set('Cookie', cookie)
      .expect(200);

    // The preview must show the exact stored text, formatting intact.
    expect(item<WritingRow>(res).content).toBe(FIXTURE);
  });

  it('7. publishes it', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/writings/${id}/publish`)
      .set('Cookie', cookie)
      .expect(200);

    const published = item<WritingRow>(res);
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).toBeTruthy();
  });

  it('8. the public API now returns it', async () => {
    const list = await request(app).get('/api/v1/writings').expect(200);
    expect(items(list)).toHaveLength(1);
    expect(items(list)[0]?.slug).toBe(slug);
  });

  it('9. the shareable URL serves it with its formatting byte-for-byte intact', async () => {
    const res = await request(app).get(`/api/v1/writings/${slug}`).expect(200);
    const writing = item<WritingRow>(res);

    expect(writing.content).toBe(FIXTURE);
    expect(writing.content.split('\n')).toHaveLength(5);
    expect(writing.content).toContain('\n\n');
    expect(writing.content).toContain('    an indented line');
    expect(writing.content).toContain('—');
    expect(writing.content).toContain('…');
  });

  it('10. carries the fields the reading page needs for SEO', async () => {
    const writing = item<WritingRow>(
      await request(app).get(`/api/v1/writings/${slug}`).expect(200),
    );

    expect(writing.title).toBeTruthy();
    expect(writing.excerpt).toBeTruthy();
    expect(writing.slug).toBe(slug);
    expect(writing.publishedAt).toBeTruthy();
    expect(writing.updatedAt).toBeTruthy();
    expect((writing.seo as { noindex: boolean }).noindex).toBe(false);
  });

  it('11. appears in the sitemap feed', async () => {
    const res = await request(app).get('/api/v1/sitemap-entries').expect(200);
    expect(items(res).map((entry) => entry.slug)).toContain(slug);
  });

  it('12. is searchable and filterable', async () => {
    expect(items(await request(app).get('/api/v1/writings?q=indented').expect(200))).toHaveLength(
      1,
    );
    expect(
      items(await request(app).get('/api/v1/writings?category=ABSENCE_LOSS').expect(200)),
    ).toHaveLength(1);
    expect(
      items(await request(app).get('/api/v1/writings?featured=true').expect(200)),
    ).toHaveLength(1);
    expect(
      items(await request(app).get('/api/v1/writings?language=HINDI').expect(200)),
    ).toHaveLength(0);
  });

  it('13. offers related writings once a sibling exists', async () => {
    const sibling = await request(app)
      .post('/api/v1/admin/writings')
      .set('Cookie', cookie)
      .send({
        title: 'A Sibling Fixture',
        content: 'another fixture line',
        language: 'ENGLISH',
        primaryCategory: 'ABSENCE_LOSS',
        themes: ['loss'],
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/admin/writings/${item<WritingRow>(sibling)._id}/publish`)
      .set('Cookie', cookie)
      .expect(200);

    const related = await request(app).get(`/api/v1/writings/${slug}/related`).expect(200);
    expect(items(related).map((r) => r.slug)).toContain('a-sibling-fixture');
    expect(items(related).map((r) => r.slug)).not.toContain(slug);
  });

  it('14. unpublishes, and it disappears from the public API', async () => {
    await request(app)
      .post(`/api/v1/admin/writings/${id}/unpublish`)
      .set('Cookie', cookie)
      .expect(200);

    await request(app).get(`/api/v1/writings/${slug}`).expect(404);
    expect(
      items(await request(app).get('/api/v1/writings').expect(200)).map((w) => w.slug),
    ).not.toContain(slug);
  });

  it('15. deletes it, and it is gone', async () => {
    await request(app).delete(`/api/v1/admin/writings/${id}`).set('Cookie', cookie).expect(204);

    await request(app).get(`/api/v1/admin/writings/${id}`).set('Cookie', cookie).expect(404);
    await request(app).get(`/api/v1/writings/${slug}`).expect(404);
  });

  it('16. signing out ends the session', async () => {
    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie).expect(204);
    await request(app).get('/api/v1/admin/writings').set('Cookie', cookie).expect(401);
  });
});
