import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import { err, item } from '../test/factory.js';
import { SiteSettings } from '../models/index.js';

const app = createApp();

beforeAll(async () => {
  await startTestDatabase();
});
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);

describe('public content endpoints', () => {
  it('serves a book document on a fresh database rather than a 404', async () => {
    const res = await request(app).get('/api/v1/book').expect(200);
    expect(item<{ title: string }>(res).title).toBe('Leaving and Living');
  });

  it('leaves unconfirmed book facts empty rather than inventing them', async () => {
    const book = item<Record<string, unknown>>(await request(app).get('/api/v1/book').expect(200));
    expect(book.publisher).toBe('');
    expect(book.isbn).toBe('');
    expect(book.price).toBe('');
    expect(book.publicationDate).toBeNull();
    expect(book.formats).toEqual([]);
    expect(book.reviews).toEqual([]);
  });

  it('exposes no age or birth date on the about document', async () => {
    const about = item<Record<string, unknown>>(
      await request(app).get('/api/v1/about').expect(200),
    );
    expect(Object.keys(about)).not.toContain('age');
    expect(Object.keys(about)).not.toContain('birthDate');
    expect(Object.keys(about)).not.toContain('dateOfBirth');
  });

  it('serves abyss and settings', async () => {
    expect(item<{ name: string }>(await request(app).get('/api/v1/abyss').expect(200)).name).toBe(
      'ABYSS',
    );
    await request(app).get('/api/v1/settings').expect(200);
  });

  it('reports that contact messages cannot be delivered yet', async () => {
    const settings = item<{ contactDelivery: string }>(
      await request(app).get('/api/v1/settings').expect(200),
    );
    expect(settings.contactDelivery).toBe('NONE');
  });

  it('allows public caching of content reads', async () => {
    const res = await request(app).get('/api/v1/about').expect(200);
    expect(res.headers['cache-control']).toContain('s-maxage');
  });
});

describe('POST /contact', () => {
  const valid = {
    name: 'A reader',
    email: 'reader@example.test',
    message: 'I read your work and wanted to say something about it.',
  };

  it('accepts a valid message', async () => {
    const res = await request(app).post('/api/v1/contact').send(valid).expect(200);
    expect(item<{ received: boolean }>(res).received).toBe(true);
  });

  it('is explicit that no transport is configured yet', async () => {
    const res = await request(app).post('/api/v1/contact').send(valid).expect(200);
    // The API must not imply delivery it cannot perform.
    expect(item<{ delivery: string }>(res).delivery).toBe('PENDING_TRANSPORT');
  });

  it('rejects a message that is too short', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, message: 'hi' })
      .expect(400);
    expect(err(res).code).toBe('VALIDATION_FAILED');
  });

  it('rejects a malformed address', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, email: 'nope' })
      .expect(400);
  });

  it('tolerates an address pasted with whitespace', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, email: '  reader@example.test  ' })
      .expect(200);
  });

  it('accepts a Devanagari message', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, message: 'आपकी कविताएँ पढ़ीं, बहुत कुछ महसूस हुआ। धन्यवाद।' })
      .expect(200);
  });

  it('silently accepts a filled honeypot so a bot learns nothing', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, website: 'http://spam.example' })
      .expect(400);
    // The schema rejects it outright, which is the stronger behaviour.
    expect(err(res).code).toBe('VALIDATION_FAILED');
  });

  it('can be closed by the owner without a deploy', async () => {
    await SiteSettings.create({ contactFormEnabled: false });
    const res = await request(app).post('/api/v1/contact').send(valid).expect(403);
    expect(err(res).code).toBe('FORBIDDEN');
  });

  it('is never cached', async () => {
    const res = await request(app).post('/api/v1/contact').send(valid);
    expect(res.headers['cache-control']).toContain('no-store');
  });
});
