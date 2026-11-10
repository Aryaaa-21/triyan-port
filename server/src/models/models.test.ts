import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { About, Book, Session, SiteSettings, User } from './index.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';
import { Types } from 'mongoose';

beforeAll(async () => {
  await startTestDatabase();
});
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);

describe('User model', () => {
  const make = (over = {}) => ({
    email: 'triyan@example.com',
    passwordHash: 'argon2-hash',
    ...over,
  });

  it('never returns the password hash by default', async () => {
    const created = await User.create(make());
    const found = await User.findById(created._id).lean();
    expect(found).toBeTruthy();
    expect(found).not.toHaveProperty('passwordHash');
  });

  it('returns the hash only when explicitly selected', async () => {
    const created = await User.create(make());
    const withHash = await User.findById(created._id).select('+passwordHash').lean();
    expect(withHash?.passwordHash).toBe('argon2-hash');
  });

  it('lowercases the email and enforces uniqueness', async () => {
    const created = await User.create(make({ email: 'Triyan@Example.COM' }));
    expect(created.email).toBe('triyan@example.com');
    await expect(User.create(make())).rejects.toThrow(/duplicate key/i);
  });

  it('requires an email and a hash', async () => {
    await expect(User.create({})).rejects.toThrow();
    await expect(User.create({ email: 'a@b.co' })).rejects.toThrow();
  });

  it('starts unlocked with no failed logins', async () => {
    const created = await User.create(make());
    expect(created.failedLoginCount).toBe(0);
    expect(created.lockedUntil).toBeNull();
    expect(created.role).toBe('ADMIN');
  });
});

describe('Session model', () => {
  const make = (over = {}) => ({
    user: new Types.ObjectId(),
    tokenHash: 'a'.repeat(64),
    family: 'family-1',
    expiresAt: new Date(Date.now() + 86_400_000),
    ...over,
  });

  it('stores only a hash, never a usable token', async () => {
    const created = await Session.create(make());
    expect(created.tokenHash).toHaveLength(64);
    expect(created).not.toHaveProperty('token');
  });

  it('rejects a duplicate token hash', async () => {
    await Session.create(make());
    await expect(Session.create(make())).rejects.toThrow(/duplicate key/i);
  });

  it('has a TTL index so dead sessions expire without a cron job', async () => {
    const indexes = await Session.collection.indexes();
    const ttl = indexes.find((i) => JSON.stringify(i.key) === JSON.stringify({ expiresAt: 1 }));
    expect(ttl?.expireAfterSeconds).toBe(0);
  });

  it('groups tokens into a family for reuse detection', async () => {
    await Session.create(make({ family: 'f1' }));
    await Session.create(make({ tokenHash: 'b'.repeat(64), family: 'f1' }));
    expect(await Session.countDocuments({ family: 'f1' })).toBe(2);
  });
});

describe('Book model', () => {
  it('defaults every unconfirmed fact to empty rather than inventing one', async () => {
    const book = await Book.create({});
    expect(book.title).toBe('Leaving and Living');
    expect(book.publisher).toBe('');
    expect(book.isbn).toBe('');
    expect(book.price).toBe('');
    expect(book.publicationDate).toBeNull();
    expect(book.formats).toEqual([]);
    expect(book.reviews).toEqual([]);
  });

  it('is a singleton', async () => {
    await Book.create({});
    await expect(Book.create({})).rejects.toThrow(/duplicate key/i);
  });

  it('accepts a real supplied review but never generates one', async () => {
    const book = await Book.create({
      reviews: [{ quote: 'A real reader quote', attribution: 'A reader' }],
    });
    expect(book.reviews).toHaveLength(1);
    expect(book.reviews[0]?.quote).toBe('A real reader quote');
  });
});

describe('About model', () => {
  it('has no field capable of storing an age or birth date', async () => {
    const about = await About.create({});
    const keys = Object.keys(about.toObject());
    expect(keys).not.toContain('age');
    expect(keys).not.toContain('birthDate');
    expect(keys).not.toContain('dateOfBirth');
  });

  it('keeps writingSince as owner-controlled free text, defaulting to empty', async () => {
    const about = await About.create({});
    expect(about.writingSince).toBe('');
  });

  it('is a singleton', async () => {
    await About.create({});
    await expect(About.create({})).rejects.toThrow(/duplicate key/i);
  });

  it('preserves paragraph breaks in the body', async () => {
    const body = 'First paragraph.\n\nSecond paragraph.';
    const about = await About.create({ body });
    expect((await About.findById(about._id).lean())?.body).toBe(body);
  });
});

describe('SiteSettings model', () => {
  it('is a singleton with safe defaults', async () => {
    const settings = await SiteSettings.create({});
    expect(settings.contactFormEnabled).toBe(true);
    expect(settings.introEnabled).toBe(true);
    await expect(SiteSettings.create({})).rejects.toThrow(/duplicate key/i);
  });
});
