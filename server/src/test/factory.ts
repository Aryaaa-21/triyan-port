import request from 'supertest';
import type { Express } from 'express';
import { createAdmin } from '../services/auth.service.js';
import { SESSION_COOKIE } from '../services/session.service.js';
import { Writing } from '../models/index.js';

export const ADMIN_EMAIL = 'triyan@example.test';
export const ADMIN_PASSWORD = 'CorrectHorse99Battery';

/**
 * Development fixtures only. These are obviously-synthetic strings, never presented
 * as Triyan's work, and never seeded into a real database (spec: no fabricated poems).
 */
export const FIXTURE_POEM = [
  'first line of a fixture',
  'second line',
  '',
  'after the stanza break',
].join('\n');
export const FIXTURE_HINDI = ['पहली पंक्ति', '', 'दूसरी पंक्ति'].join('\n');

export const seedAdmin = async () => createAdmin(ADMIN_EMAIL, ADMIN_PASSWORD, 'Triyan');

/** Logs in and returns the Cookie header value for authenticated requests. */
export const loginAsAdmin = async (app: Express): Promise<string> => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .expect(200);

  const raw: unknown = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(raw)
    ? raw.filter((c): c is string => typeof c === 'string')
    : typeof raw === 'string'
      ? [raw]
      : [];

  const session = cookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!session) throw new Error('login did not set a session cookie');

  const pair = session.split(';')[0];
  if (!pair) throw new Error('malformed session cookie');
  return pair;
};

export const makeWriting = (over: Record<string, unknown> = {}) =>
  Writing.create({
    title: 'A Fixture Writing',
    slug: 'a-fixture-writing',
    content: FIXTURE_POEM,
    ...over,
  });

/* --------------------------------------------------------- typed responses */

/**
 * supertest types `response.body` as `any`. These accessors restore type checking at
 * the assertion site without casting anything to `any` or disabling a lint rule.
 */
interface ErrorEnvelope {
  error: { code: string; message: string; requestId?: string; details?: unknown };
}
interface DataEnvelope<T> {
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

/** The shape of a serialised writing, which is what most assertions look at. */
export interface WritingRow {
  _id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  language: string;
  featured: boolean;
  publishedAt: string | null;
  [key: string]: unknown;
}

export const err = (res: { body: unknown }): ErrorEnvelope['error'] =>
  (res.body as ErrorEnvelope).error;

export const item = <T = WritingRow>(res: { body: unknown }): T =>
  (res.body as DataEnvelope<T>).data;

export const items = <T = WritingRow>(res: { body: unknown }): T[] =>
  (res.body as DataEnvelope<T[]>).data;

export const meta = (res: { body: unknown }): NonNullable<DataEnvelope<unknown>['meta']> => {
  const value = (res.body as DataEnvelope<unknown>).meta;
  if (!value) throw new Error('response carried no meta');
  return value;
};
