import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './test/db.js';
import { makeWriting } from './test/factory.js';

const app = createApp();

beforeAll(async () => {
  await startTestDatabase();
});
afterAll(async () => {
  await clearTestDatabase();
  await stopTestDatabase();
});

describe('files for crawlers', () => {
  it('serves robots.txt: open, except the admin and the API, pointing at the sitemap', async () => {
    const res = await request(app).get('/robots.txt').set('host', 'triyan.test').expect(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('Disallow: /admin');
    expect(res.text).toContain('Disallow: /api/');
    expect(res.text).toContain('Sitemap: http://triyan.test/sitemap.xml');
  });

  it('serves sitemap.xml with the pages and published writings only', async () => {
    await makeWriting({ slug: 'published-one', status: 'PUBLISHED' });
    await makeWriting({ slug: 'a-draft', title: 'A Draft' });
    const res = await request(app).get('/sitemap.xml').set('host', 'triyan.test').expect(200);
    expect(res.headers['content-type']).toContain('application/xml');
    expect(res.text).toContain('<loc>http://triyan.test/</loc>');
    expect(res.text).toContain('<loc>http://triyan.test/writings/published-one</loc>');
    expect(res.text).not.toContain('a-draft');
  });
});

describe('one origin for the site and the API', () => {
  it('accepts requests from its own origin without configuration', async () => {
    const res = await request(app)
      .get('/api/v1')
      .set('host', 'triyan.test')
      .set('origin', 'http://triyan.test')
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://triyan.test');
  });

  it('still refuses an unknown origin', async () => {
    await request(app)
      .get('/api/v1')
      .set('host', 'triyan.test')
      .set('origin', 'https://elsewhere.example')
      .expect(403);
  });
});

describe('serving the built website', () => {
  const dist = mkdtempSync(join(tmpdir(), 'triyan-dist-'));
  mkdirSync(join(dist, 'assets'));
  writeFileSync(join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
  writeFileSync(join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
  const site = createApp({ clientDist: dist });
  afterAll(() => rmSync(dist, { recursive: true, force: true }));

  it('answers every page with the app, for its router to take over', async () => {
    await makeWriting({ slug: 'a-real-poem', status: 'PUBLISHED' });
    for (const path of ['/about', '/writings', '/writings/a-real-poem', '/admin/login']) {
      const res = await request(site).get(path).set('accept', 'text/html').expect(200);
      expect(res.text).toContain('<div id="root">');
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  it('gives pages that do not exist a real 404, not a soft one', async () => {
    for (const path of ['/nope', '/writings/never-written', '/instagram/not-an-id']) {
      const res = await request(site).get(path).set('accept', 'text/html').expect(404);
      expect(res.text).toContain('<div id="root">');
    }
  });

  it('serves fingerprinted assets as immutable', async () => {
    const res = await request(site).get('/assets/app-abc123.js').expect(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('keeps unknown API routes as JSON 404s', async () => {
    const res = await request(site).get('/api/v1/nope').set('accept', 'text/html').expect(404);
    expect(res.headers['content-type']).toContain('application/json');
  });
});
