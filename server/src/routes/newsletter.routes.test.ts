import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import { err, item, items, loginAsAdmin, makeWriting, meta, seedAdmin } from '../test/factory.js';
import { Subscriber, Writing } from '../models/index.js';
import { setTransportForTests, type Mail } from '../services/mailer.js';

const app = createApp();
const sentMail: Mail[] = [];

beforeAll(startTestDatabase);
beforeEach(() => {
  sentMail.length = 0;
  setTransportForTests((mail) => {
    sentMail.push(mail);
    return Promise.resolve();
  });
});
afterEach(async () => {
  setTransportForTests(undefined);
  await clearTestDatabase();
});
afterAll(stopTestDatabase);

const join = (email = 'Reader@Example.test') =>
  request(app).post('/api/v1/newsletter/subscribe').send({ email, consent: true });

const tokenOf = async (email: string) =>
  (await Subscriber.findOne({ email }).select('+token').lean())?.token ?? '';

/** Signs an address up and clicks the link in its confirmation email. */
const joinAndConfirm = async (email: string) => {
  await join(email).expect(200);
  await request(app)
    .get(`/api/v1/newsletter/confirm?token=${await tokenOf(email)}`)
    .expect(303);
};

describe('joining the list', () => {
  it('stores the address as pending and emails a confirmation link', async () => {
    const res = await join().expect(200);
    expect(item<{ outcome: string }>(res).outcome).toBe('CONFIRMATION_SENT');
    const stored = await Subscriber.findOne().lean();
    expect(stored?.email).toBe('reader@example.test');
    expect(stored?.status).toBe('PENDING');
    expect(sentMail).toHaveLength(1);
    expect(sentMail[0]?.to).toBe('reader@example.test');
    expect(sentMail[0]?.text).toContain(await tokenOf('reader@example.test'));
  });

  it('becomes active when the link is opened, and lands on the site', async () => {
    await join().expect(200);
    const res = await request(app)
      .get(`/api/v1/newsletter/confirm?token=${await tokenOf('reader@example.test')}`)
      .expect(303);
    expect(res.headers.location).toBe('/subscription?state=confirmed');
    expect((await Subscriber.findOne().lean())?.status).toBe('ACTIVE');
  });

  it('answers a made-up link without confirming anyone', async () => {
    await join().expect(200);
    const res = await request(app).get('/api/v1/newsletter/confirm?token=nope').expect(303);
    expect(res.headers.location).toBe('/subscription?state=invalid');
    expect((await Subscriber.findOne().lean())?.status).toBe('PENDING');
  });

  it('requires consent', async () => {
    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({ email: 'reader@example.test' })
      .expect(400);
    expect(err(res).code).toBe('VALIDATION_FAILED');
    expect(await Subscriber.countDocuments()).toBe(0);
  });

  it('does not duplicate, or reveal, an address already on the list', async () => {
    await joinAndConfirm('reader@example.test');
    sentMail.length = 0;
    const res = await join('reader@example.test').expect(200);
    expect(item<{ outcome: string }>(res).outcome).toBe('CONFIRMATION_SENT');
    expect(await Subscriber.countDocuments()).toBe(1);
    expect(sentMail).toHaveLength(0);
  });

  it('takes the ticked box as the yes while no email provider is connected', async () => {
    setTransportForTests(null);
    const res = await join().expect(200);
    expect(item<{ outcome: string }>(res).outcome).toBe('SUBSCRIBED');
    expect((await Subscriber.findOne().lean())?.status).toBe('ACTIVE');
  });

  it('ignores a filled honeypot', async () => {
    await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({ email: 'bot@example.test', consent: true, website: '' })
      .expect(200);
    expect(await Subscriber.countDocuments()).toBe(1);
  });
});

describe('leaving the list', () => {
  it('unsubscribes with the token, and a later sign-up starts again', async () => {
    await joinAndConfirm('reader@example.test');
    const token = await tokenOf('reader@example.test');
    const res = await request(app)
      .post('/api/v1/newsletter/unsubscribe')
      .send({ token })
      .expect(200);
    expect(item<{ unsubscribed: boolean }>(res).unsubscribed).toBe(true);
    expect((await Subscriber.findOne().lean())?.status).toBe('UNSUBSCRIBED');

    await join('reader@example.test').expect(200);
    expect((await Subscriber.findOne().lean())?.status).toBe('PENDING');
  });

  it("accepts a mail app's one-click unsubscribe (token in the address)", async () => {
    await joinAndConfirm('reader@example.test');
    const token = await tokenOf('reader@example.test');
    await request(app).post(`/api/v1/newsletter/unsubscribe?token=${token}`).expect(200);
    expect((await Subscriber.findOne().lean())?.status).toBe('UNSUBSCRIBED');
  });
});

describe('announcing a writing', () => {
  let cookie = '';
  beforeEach(async () => {
    await seedAdmin();
    cookie = await loginAsAdmin(app);
  });

  const announce = (id: string) =>
    request(app).post(`/api/v1/admin/writings/${id}/announce`).set('Cookie', cookie);

  it('is for the owner only', async () => {
    const writing = await makeWriting({ status: 'PUBLISHED' });
    await request(app)
      .post(`/api/v1/admin/writings/${String(writing._id)}/announce`)
      .expect(401);
  });

  it('emails confirmed subscribers only, each with their own unsubscribe link', async () => {
    await joinAndConfirm('one@example.test');
    await joinAndConfirm('two@example.test');
    await join('pending@example.test').expect(200);
    sentMail.length = 0;

    const writing = await makeWriting({ title: 'A quiet room', status: 'PUBLISHED' });
    const res = await announce(String(writing._id)).expect(200);
    expect(item<{ sent: number; total: number }>(res)).toMatchObject({ sent: 2, total: 2 });

    expect(sentMail.map((m) => m.to).sort()).toEqual(['one@example.test', 'two@example.test']);
    const first = sentMail.find((m) => m.to === 'one@example.test');
    expect(first?.subject).toContain('A quiet room');
    expect(first?.text).toContain(`/writings/${writing.slug}`);
    expect(first?.text).toContain(await tokenOf('one@example.test'));
    expect(first?.text).not.toContain(await tokenOf('two@example.test'));
    expect(first?.headers?.['List-Unsubscribe']).toContain('/api/v1/newsletter/unsubscribe');
    expect((await Writing.findById(writing._id).lean())?.notifiedAt).toBeInstanceOf(Date);
  });

  it('never sends the same writing twice', async () => {
    await joinAndConfirm('one@example.test');
    const writing = await makeWriting({ status: 'PUBLISHED' });
    await announce(String(writing._id)).expect(200);
    sentMail.length = 0;
    const again = await announce(String(writing._id)).expect(409);
    expect(err(again).message).toMatch(/already/i);
    expect(sentMail).toHaveLength(0);
  });

  it('refuses a draft', async () => {
    await joinAndConfirm('one@example.test');
    sentMail.length = 0;
    const writing = await makeWriting({ status: 'DRAFT' });
    await announce(String(writing._id)).expect(409);
    expect(sentMail).toHaveLength(0);
  });

  it('can be retried when not a single email went out', async () => {
    await joinAndConfirm('one@example.test');
    const writing = await makeWriting({ status: 'PUBLISHED' });
    setTransportForTests(() => Promise.reject(new Error('provider down')));
    const res = await announce(String(writing._id)).expect(200);
    expect(item<{ sent: number; failed: number }>(res)).toMatchObject({ sent: 0, failed: 1 });
    expect((await Writing.findById(writing._id).lean())?.notifiedAt).toBeNull();
  });

  it('says so plainly when no email provider is connected', async () => {
    setTransportForTests(null);
    const writing = await makeWriting({ status: 'PUBLISHED' });
    const res = await announce(String(writing._id)).expect(409);
    expect(err(res).message).toMatch(/not set up/i);
  });

  it('lists subscribers with counts, without their tokens, and can remove one', async () => {
    await joinAndConfirm('one@example.test');
    await join('pending@example.test').expect(200);
    const list = await request(app)
      .get('/api/v1/admin/subscribers')
      .set('Cookie', cookie)
      .expect(200);
    const rows = items<{ _id: string; email: string; token?: string }>(list);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.token === undefined)).toBe(true);
    expect(meta(list)).toMatchObject({ active: 1, pending: 1, unsubscribed: 0 });

    await request(app)
      .delete(`/api/v1/admin/subscribers/${rows[0]?._id ?? ''}`)
      .set('Cookie', cookie)
      .expect(204);
    expect(await Subscriber.countDocuments()).toBe(1);
  });
});
