import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Writing } from './writing.model.js';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../test/db.js';

beforeAll(async () => {
  await startTestDatabase();
});
afterEach(clearTestDatabase);
afterAll(stopTestDatabase);

const POEM = [
  'I loved you long after',
  'you stopped loving me.',
  '',
  'And still, the room',
  'keeps your shape.',
].join('\n');
const HINDI = ['तन्हाई मेरी पहचान है,', '', 'मैं वहीं हूँ', 'जहाँ तुम नहीं हो।'].join('\n');

const make = (over: Record<string, unknown> = {}) => ({
  title: 'Existing Without Belonging',
  slug: 'existing-without-belonging',
  content: POEM,
  ...over,
});

describe('Writing model — storage fidelity', () => {
  it('stores a poem byte-for-byte, including stanza breaks', async () => {
    const saved = await Writing.create(make());
    const read = await Writing.findById(saved._id).lean();
    expect(read?.content).toBe(POEM);
    expect(read?.content.split('\n')).toHaveLength(5);
    expect(read?.content).toContain('\n\n');
  });

  it('does not trim content, so indentation and trailing newlines survive', async () => {
    const indented = '    a measured line\n        deeper still\n\n';
    const saved = await Writing.create(make({ content: indented, slug: 'indented' }));
    expect((await Writing.findById(saved._id).lean())?.content).toBe(indented);
  });

  it('round-trips Devanagari unchanged', async () => {
    const saved = await Writing.create(
      make({ content: HINDI, slug: 'tanhaai', language: 'HINDI', title: 'तन्हाई' }),
    );
    const read = await Writing.findById(saved._id).lean();
    expect(read?.content).toBe(HINDI);
    expect(read?.title).toBe('तन्हाई');
    expect(read?.language).toBe('HINDI');
  });

  it('preserves typographic punctuation', async () => {
    const text = '“I loved you” — he said… and then —\nnothing.';
    const saved = await Writing.create(make({ content: text, slug: 'typographic' }));
    expect((await Writing.findById(saved._id).lean())?.content).toBe(text);
  });
});

describe('Writing model — validation', () => {
  it('requires a title, slug and content', async () => {
    await expect(Writing.create({})).rejects.toThrow();
  });

  it('enforces slug uniqueness at the database level', async () => {
    await Writing.create(make());
    await expect(Writing.create(make({ title: 'Another' }))).rejects.toThrow(/duplicate key/i);
  });

  it('lowercases a slug on write', async () => {
    const saved = await Writing.create(make({ slug: 'Mixed-Case-Slug' }));
    expect(saved.slug).toBe('mixed-case-slug');
  });

  it('rejects a malformed slug', async () => {
    await expect(Writing.create(make({ slug: 'not a slug' }))).rejects.toThrow();
  });

  it('rejects an unknown category, theme or emotion', async () => {
    await expect(Writing.create(make({ primaryCategory: 'SADNESS' }))).rejects.toThrow();
    await expect(Writing.create(make({ themes: ['yearning'] }))).rejects.toThrow();
    await expect(Writing.create(make({ emotions: ['rage'] }))).rejects.toThrow();
  });

  it('caps secondary categories, themes, emotions and tags', async () => {
    await expect(
      Writing.create(
        make({ secondaryCategories: ['LOVE_LONGING', 'ABSENCE_LOSS', 'GRIEF_MELANCHOLY'] }),
      ),
    ).rejects.toThrow();
    await expect(
      Writing.create(
        make({
          themes: ['love', 'grief', 'loss', 'death', 'hope', 'time', 'memory', 'faith', 'identity'],
        }),
      ),
    ).rejects.toThrow();
    await expect(
      Writing.create(make({ tags: Array.from({ length: 21 }, (_, i) => `t${i}`) })),
    ).rejects.toThrow();
  });

  it('defaults to a draft that is not featured and has no publication date', async () => {
    const saved = await Writing.create(make());
    expect(saved.status).toBe('DRAFT');
    expect(saved.featured).toBe(false);
    expect(saved.publishedAt).toBeNull();
    expect(saved.bookExclusive).toBe(false);
  });
});

describe('Writing model — publication', () => {
  it('stamps publishedAt the first time it is published', async () => {
    const doc = await Writing.create(make());
    expect(doc.publishedAt).toBeNull();

    doc.status = 'PUBLISHED';
    await doc.save();
    expect(doc.publishedAt).toBeInstanceOf(Date);
  });

  it('does not move publishedAt when a published writing is edited', async () => {
    const doc = await Writing.create(make({ status: 'PUBLISHED' }));
    const first = doc.publishedAt;

    doc.title = 'Edited title';
    await doc.save();
    expect(doc.publishedAt?.getTime()).toBe(first?.getTime());
  });
});

describe('Writing model — indexes', () => {
  it('creates the indexes the archive queries rely on', async () => {
    const indexes = await Writing.collection.indexes();
    const keys = indexes.map((i) => JSON.stringify(i.key));

    expect(keys).toContain(JSON.stringify({ slug: 1 }));
    expect(keys).toContain(JSON.stringify({ status: 1, publishedAt: -1 }));
    expect(keys).toContain(JSON.stringify({ status: 1, featured: 1, publishedAt: -1 }));
    expect(keys).toContain(JSON.stringify({ themes: 1 }));
    expect(indexes.some((i) => i.name === 'writing_text')).toBe(true);
  });

  it('marks the slug index unique', async () => {
    const indexes = await Writing.collection.indexes();
    expect(indexes.find((i) => JSON.stringify(i.key) === JSON.stringify({ slug: 1 }))?.unique).toBe(
      true,
    );
  });

  it('finds an English poem by a word in its body', async () => {
    await Writing.create(make({ status: 'PUBLISHED' }));
    const found = await Writing.find({ $text: { $search: 'loving' } });
    expect(found).toHaveLength(1);
  });

  it('finds a Hindi poem by a Devanagari token', async () => {
    await Writing.create(
      make({ content: HINDI, slug: 'hindi-poem', title: 'तन्हाई', status: 'PUBLISHED' }),
    );
    const found = await Writing.find({ $text: { $search: 'तन्हाई' } });
    expect(found).toHaveLength(1);
  });
});
