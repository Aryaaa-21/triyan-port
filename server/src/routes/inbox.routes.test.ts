import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import { err, item, items, loginAsAdmin, seedAdmin } from '../test/factory.js';
import { ContactMessage, WaitlistSubscriber } from '../models/index.js';

const app = createApp();

beforeAll(startTestDatabase);
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);

describe('POST /waitlist', () => {
  const valid = { email: 'Reader@Example.test', consent: true };

  it('adds an address once, normalised, with the moment of consent', async () => {
    const res = await request(app).post('/api/v1/waitlist').send(valid).expect(200);
    expect(item<{ joined: boolean }>(res).joined).toBe(true);
    const stored = await WaitlistSubscriber.findOne().lean();
    expect(stored?.email).toBe('reader@example.test');
    expect(stored?.consentAt).toBeInstanceOf(Date);
  });

  it('accepts a second sign-up without duplicating or revealing it', async () => {
    await request(app).post('/api/v1/waitlist').send(valid).expect(200);
    const again = await request(app).post('/api/v1/waitlist').send(valid).expect(200);
    expect(item<{ joined: boolean }>(again).joined).toBe(true);
    expect(await WaitlistSubscriber.countDocuments()).toBe(1);
  });

  it('requires explicit consent', async () => {
    const res = await request(app)
      .post('/api/v1/waitlist')
      .send({ email: 'reader@example.test' })
      .expect(400);
    expect(err(res).code).toBe('VALIDATION_FAILED');
    expect(await WaitlistSubscriber.countDocuments()).toBe(0);
  });

  it('rejects a malformed address', async () => {
    await request(app).post('/api/v1/waitlist').send({ email: 'nope', consent: true }).expect(400);
  });
});

describe('admin inbox and waitlist', () => {
  let cookie = '';
  beforeEach(async () => {
    await seedAdmin();
    cookie = await loginAsAdmin(app);
  });

  it('keeps every inbox and waitlist route behind a session', async () => {
    const id = '0123456789abcdef01234567';
    await request(app).get('/api/v1/admin/inbox').expect(401);
    await request(app).patch(`/api/v1/admin/inbox/${id}`).send({ read: true }).expect(401);
    await request(app).delete(`/api/v1/admin/inbox/${id}`).expect(401);
    await request(app).get('/api/v1/admin/waitlist').expect(401);
    await request(app).get('/api/v1/admin/waitlist.csv').expect(401);
  });

  it('lists messages unread first, marks them read, and deletes them', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'A reader',
        email: 'r@example.test',
        message: 'Something here stayed with me.',
      })
      .expect(200);
    const list = await request(app).get('/api/v1/admin/inbox').set('Cookie', cookie).expect(200);
    const [message] = items<{ _id: string; read: boolean; message: string }>(list);
    expect(message?.read).toBe(false);
    expect((list.body as { meta: { unread: number } }).meta.unread).toBe(1);

    const marked = await request(app)
      .patch(`/api/v1/admin/inbox/${message?._id}`)
      .set('Cookie', cookie)
      .send({ read: true })
      .expect(200);
    expect(item<{ read: boolean }>(marked).read).toBe(true);

    await request(app)
      .delete(`/api/v1/admin/inbox/${message?._id}`)
      .set('Cookie', cookie)
      .expect(204);
    expect(await ContactMessage.countDocuments()).toBe(0);
  });

  it('lists and exports the waitlist as CSV', async () => {
    await request(app).post('/api/v1/waitlist').send({ email: 'a@example.test', consent: true });
    await request(app).post('/api/v1/waitlist').send({ email: 'b@example.test', consent: true });
    const list = await request(app).get('/api/v1/admin/waitlist').set('Cookie', cookie).expect(200);
    expect((list.body as { meta: { total: number } }).meta.total).toBe(2);

    const csv = await request(app)
      .get('/api/v1/admin/waitlist.csv')
      .set('Cookie', cookie)
      .expect(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    const lines = csv.text.split('\n');
    expect(lines[0]).toBe('email,name,consented_at');
    expect(lines).toHaveLength(3);
  });

  it('never exposes the inbox or the waitlist through a public route', async () => {
    await request(app).get('/api/v1/inbox').expect(404);
    await request(app).get('/api/v1/waitlist').expect(404);
  });
});
