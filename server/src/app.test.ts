import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { ApiErrorBody, ApiSuccess } from '@triyan/shared';
import { createApp } from './app.js';

const app = createApp();

/**
 * supertest types `response.body` as `any`. Reading it through this accessor keeps
 * the assertions type-checked instead of silencing the rule at the call site.
 */
const json = <T>(response: { body: unknown }): T => response.body as T;

describe('server shell', () => {
  it('reports liveness without touching the database', async () => {
    const res = await request(app).get('/healthz').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'triyan-api' });
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('exposes a versioned api root', async () => {
    const res = await request(app).get('/api/v1').expect(200);
    const { data } = json<ApiSuccess<{ name: string; version: string }>>(res);
    expect(data.version).toBe('v1');
    expect(data.name).toBe('Triyan API');
  });

  it('returns the standard error envelope for an unknown route', async () => {
    const res = await request(app).get('/api/v1/nope').expect(404);
    const { error } = json<ApiErrorBody>(res);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.requestId).toBeTruthy();
  });

  it('echoes a correlation id on every response', async () => {
    const res = await request(app).get('/healthz').set('x-request-id', 'abc-123').expect(200);
    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('rejects a forged correlation id rather than reflecting it', async () => {
    const res = await request(app)
      .get('/healthz')
      .set('x-request-id', '../../etc/passwd')
      .expect(200);
    expect(res.headers['x-request-id']).not.toBe('../../etc/passwd');
  });

  it('does not advertise the server implementation', async () => {
    const res = await request(app).get('/healthz');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets hardening headers from helmet', async () => {
    const res = await request(app).get('/healthz');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
