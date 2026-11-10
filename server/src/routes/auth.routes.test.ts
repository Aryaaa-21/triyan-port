import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  err,
  item,
  loginAsAdmin,
  seedAdmin,
} from '../test/factory.js';
import { SESSION_COOKIE } from '../services/session.service.js';
import { Session, User } from '../models/index.js';
import { MAX_FAILED_LOGINS } from '../services/auth.service.js';

const app = createApp();

beforeAll(async () => {
  await startTestDatabase();
});
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);
beforeEach(seedAdmin);

describe('POST /auth/login', () => {
  it('accepts correct credentials and sets an httpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const session = cookies.find((c) => c.startsWith(SESSION_COOKIE));
    expect(session).toBeTruthy();
    expect(session).toContain('HttpOnly');
    expect(session).toContain('SameSite=Lax');
  });

  it('never returns the password hash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('argon2');
  });

  it('is case-insensitive about the address', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL.toUpperCase(), password: ADMIN_PASSWORD })
      .expect(200);
  });

  it('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrong' })
      .expect(401);
    expect(err(res).code).toBe('UNAUTHENTICATED');
  });

  it('gives an unknown address the same answer as a wrong password', async () => {
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.test', password: 'whatever' })
      .expect(401);
    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrong' })
      .expect(401);

    // Identical responses: the form must not reveal which addresses exist.
    expect(err(unknown).message).toBe(err(wrong).message);
  });

  it('rejects a malformed payload without revealing which field failed', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nope' }).expect(401);
    expect(err(res).code).toBe('UNAUTHENTICATED');
  });

  it('locks the account after repeated failures', async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i += 1) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: 'wrong' })
        .expect(401);
    }

    const locked = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(429);

    expect(err(locked).code).toBe('RATE_LIMITED');
    expect(locked.headers['retry-after']).toBeTruthy();
  });

  it('clears the failure count after a successful sign-in', async () => {
    await request(app).post('/api/v1/auth/login').send({ email: ADMIN_EMAIL, password: 'wrong' });
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    const user = await User.findOne({ email: ADMIN_EMAIL });
    expect(user?.failedLoginCount).toBe(0);
    expect(user?.lastLoginAt).toBeInstanceOf(Date);
  });

  it('stores only a hash of the session token', async () => {
    const cookie = await loginAsAdmin(app);
    const raw = cookie.split('=')[1] as string;
    const stored = await Session.findOne({});
    expect(stored?.tokenHash).toHaveLength(64);
    expect(stored?.tokenHash).not.toBe(raw);
  });
});

describe('GET /auth/me', () => {
  it('rejects an anonymous request', async () => {
    const res = await request(app).get('/api/v1/auth/me').expect(401);
    expect(err(res).code).toBe('UNAUTHENTICATED');
  });

  it('rejects a forged cookie', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `${SESSION_COOKIE}=not-a-real-token`)
      .expect(401);
  });

  it('returns the signed-in administrator', async () => {
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie).expect(200);
    expect(item(res).email).toBe(ADMIN_EMAIL);
    expect(item(res)).not.toHaveProperty('passwordHash');
  });

  it('is never cached', async () => {
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(res.headers['cache-control']).toContain('no-store');
  });
});

describe('session lifecycle', () => {
  it('rejects a session after logout', async () => {
    const cookie = await loginAsAdmin(app);
    await request(app).get('/api/v1/auth/me').set('Cookie', cookie).expect(200);

    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie).expect(204);
    await request(app).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
  });

  it('rejects an expired session', async () => {
    const cookie = await loginAsAdmin(app);
    await Session.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await request(app).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
  });

  it('rejects a session idle beyond the idle window', async () => {
    const cookie = await loginAsAdmin(app);
    await Session.updateMany({}, { $set: { lastUsedAt: new Date(Date.now() - 8 * 86_400_000) } });
    await request(app).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
  });

  it('revokes the whole family when a revoked token is presented again', async () => {
    const cookie = await loginAsAdmin(app);
    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie).expect(204);

    // Presenting it a second time is evidence of theft.
    await request(app).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
    const sessions = await Session.find({});
    expect(sessions.every((s) => s.revokedAt !== null)).toBe(true);
  });

  it('logout is harmless without a session', async () => {
    await request(app).post('/api/v1/auth/logout').expect(204);
  });
});
