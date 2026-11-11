import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { startTestDatabase, stopTestDatabase } from '../test/db.js';
import { Writing } from '../models/index.js';
import { ensureIndexes } from './db.js';

beforeAll(async () => {
  await startTestDatabase();
});
afterAll(async () => {
  await stopTestDatabase();
});

describe('ensureIndexes', () => {
  it('rebuilds missing indexes on a fresh database, as production needs at start', async () => {
    await Writing.collection.dropIndexes();
    const before = await Writing.collection.indexes();
    expect(before.some((i) => i.name === 'writing_text')).toBe(false);

    await ensureIndexes();

    const after = await Writing.collection.indexes();
    expect(after.some((i) => i.name === 'writing_text')).toBe(true);
    expect(mongoose.modelNames().length).toBeGreaterThan(0);
  });
});
