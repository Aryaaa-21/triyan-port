import { describe, expect, it } from 'vitest';
import {
  seoSchema,
  writingInputSchema,
  writingQuerySchema,
  writingUpdateSchema,
} from './writing.js';

const minimal = { title: 'Existing Without Belonging', content: 'a line' };

/** A stanza-broken poem. Formatting is content, not presentation. */
const POEM = [
  'I loved you long after',
  'you stopped loving me.',
  '',
  'And still, the room',
  'keeps your shape.',
].join('\n');

const HINDI_POEM = [
  'तन्हाई मेरी पहचान है,',
  'और खामोशी मेरी ज़ुबान।',
  '',
  'मैं वहीं हूँ',
  'जहाँ तुम नहीं हो।',
].join('\n');

const HINGLISH_POEM = 'Tum chale gaye,\nand I stayed — \nकुछ अधूरा सा.';

describe('writingInputSchema — required fields', () => {
  it('accepts a minimal writing', () => {
    expect(writingInputSchema.safeParse(minimal).success).toBe(true);
  });

  it('requires a title', () => {
    expect(writingInputSchema.safeParse({ content: 'a line' }).success).toBe(false);
  });

  it('rejects a title that is only whitespace', () => {
    const result = writingInputSchema.safeParse({ ...minimal, title: '   ' });
    expect(result.success).toBe(false);
  });

  it('trims the title', () => {
    expect(writingInputSchema.parse({ ...minimal, title: '  Nothingness  ' }).title).toBe(
      'Nothingness',
    );
  });

  it('requires content', () => {
    expect(writingInputSchema.safeParse({ title: 'Untitled' }).success).toBe(false);
  });

  it('rejects empty content', () => {
    expect(writingInputSchema.safeParse({ ...minimal, content: '' }).success).toBe(false);
  });

  it('rejects a title beyond 200 characters', () => {
    expect(writingInputSchema.safeParse({ ...minimal, title: 'a'.repeat(201) }).success).toBe(
      false,
    );
  });

  it('rejects content beyond 60,000 characters', () => {
    expect(writingInputSchema.safeParse({ ...minimal, content: 'a'.repeat(60_001) }).success).toBe(
      false,
    );
  });
});

describe('writingInputSchema — poetry formatting is preserved', () => {
  it('preserves line breaks and the blank line between stanzas', () => {
    const parsed = writingInputSchema.parse({ ...minimal, content: POEM });
    expect(parsed.content).toBe(POEM);
    expect(parsed.content.split('\n')).toHaveLength(5);
    expect(parsed.content).toContain('\n\n');
  });

  it('does not trim content, so leading indentation survives', () => {
    const indented = '    a measured line\n        deeper still';
    expect(writingInputSchema.parse({ ...minimal, content: indented }).content).toBe(indented);
  });

  it('preserves trailing and leading blank lines', () => {
    const padded = '\n\nthe silence before\n\n';
    expect(writingInputSchema.parse({ ...minimal, content: padded }).content).toBe(padded);
  });

  it('preserves Devanagari exactly', () => {
    const parsed = writingInputSchema.parse({
      ...minimal,
      content: HINDI_POEM,
      language: 'HINDI',
    });
    expect(parsed.content).toBe(HINDI_POEM);
    expect(parsed.language).toBe('HINDI');
  });

  it('preserves mixed Hindi and English', () => {
    const parsed = writingInputSchema.parse({
      ...minimal,
      content: HINGLISH_POEM,
      language: 'HINGLISH',
    });
    expect(parsed.content).toBe(HINGLISH_POEM);
  });

  it('preserves typographic punctuation rather than normalising it', () => {
    const typographic = '“I loved you” — he said… and then —\nnothing.';
    expect(writingInputSchema.parse({ ...minimal, content: typographic }).content).toBe(
      typographic,
    );
  });

  it('accepts a Devanagari title', () => {
    expect(writingInputSchema.parse({ ...minimal, title: 'तन्हाई' }).title).toBe('तन्हाई');
  });
});

describe('writingInputSchema — defaults and publishing state', () => {
  it('defaults to an unpublished, unfeatured draft', () => {
    const parsed = writingInputSchema.parse(minimal);
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.featured).toBe(false);
    expect(parsed.bookExclusive).toBe(false);
  });

  it('defaults language to UNKNOWN and content type to POEM', () => {
    const parsed = writingInputSchema.parse(minimal);
    expect(parsed.language).toBe('UNKNOWN');
    expect(parsed.contentType).toBe('POEM');
  });

  it('defaults the taxonomy arrays to empty', () => {
    const parsed = writingInputSchema.parse(minimal);
    expect(parsed.themes).toEqual([]);
    expect(parsed.emotions).toEqual([]);
    expect(parsed.tags).toEqual([]);
    expect(parsed.secondaryCategories).toEqual([]);
  });

  it('defaults seo.noindex to false', () => {
    expect(writingInputSchema.parse(minimal).seo.noindex).toBe(false);
  });

  it('coerces an ISO publication date', () => {
    const parsed = writingInputSchema.parse({
      ...minimal,
      publishedAt: '2026-03-01T10:00:00.000Z',
    });
    expect(parsed.publishedAt).toBeInstanceOf(Date);
    expect(parsed.publishedAt?.getUTCFullYear()).toBe(2026);
  });

  it('rejects an unparseable date', () => {
    expect(writingInputSchema.safeParse({ ...minimal, publishedAt: 'last tuesday' }).success).toBe(
      false,
    );
  });
});

describe('writingInputSchema — taxonomy limits', () => {
  it('rejects an unknown category', () => {
    expect(writingInputSchema.safeParse({ ...minimal, primaryCategory: 'SADNESS' }).success).toBe(
      false,
    );
  });

  it('allows at most two secondary categories', () => {
    expect(
      writingInputSchema.safeParse({
        ...minimal,
        secondaryCategories: ['LOVE_LONGING', 'ABSENCE_LOSS'],
      }).success,
    ).toBe(true);
    expect(
      writingInputSchema.safeParse({
        ...minimal,
        secondaryCategories: ['LOVE_LONGING', 'ABSENCE_LOSS', 'GRIEF_MELANCHOLY'],
      }).success,
    ).toBe(false);
  });

  it('allows at most eight themes and eight emotions', () => {
    const nineThemes = [
      'love',
      'longing',
      'loss',
      'grief',
      'death',
      'hope',
      'despair',
      'time',
      'memory',
    ];
    expect(writingInputSchema.safeParse({ ...minimal, themes: nineThemes }).success).toBe(false);
  });

  it('rejects an unknown theme or emotion', () => {
    expect(writingInputSchema.safeParse({ ...minimal, themes: ['yearning'] }).success).toBe(false);
    expect(writingInputSchema.safeParse({ ...minimal, emotions: ['rage'] }).success).toBe(false);
  });

  it('trims tags and rejects empty ones', () => {
    expect(writingInputSchema.parse({ ...minimal, tags: ['  monsoon  '] }).tags).toEqual([
      'monsoon',
    ]);
    expect(writingInputSchema.safeParse({ ...minimal, tags: ['   '] }).success).toBe(false);
  });

  it('allows a Devanagari tag', () => {
    expect(writingInputSchema.parse({ ...minimal, tags: ['मौन'] }).tags).toEqual(['मौन']);
  });

  it('allows at most twenty tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
    expect(writingInputSchema.safeParse({ ...minimal, tags }).success).toBe(false);
  });

  it('validates an optional slug', () => {
    expect(writingInputSchema.safeParse({ ...minimal, slug: 'valid-slug' }).success).toBe(true);
    expect(writingInputSchema.safeParse({ ...minimal, slug: 'Invalid Slug' }).success).toBe(false);
  });

  it('rejects a cover image that is not an object id', () => {
    expect(writingInputSchema.safeParse({ ...minimal, coverImage: 'not-an-id' }).success).toBe(
      false,
    );
  });
});

describe('seoSchema', () => {
  it('bounds the title and description to what search engines display', () => {
    expect(seoSchema.safeParse({ title: 'a'.repeat(71) }).success).toBe(false);
    expect(seoSchema.safeParse({ description: 'a'.repeat(181) }).success).toBe(false);
  });

  it('requires a real URL for the og image', () => {
    expect(seoSchema.safeParse({ ogImage: 'not a url' }).success).toBe(false);
    expect(seoSchema.safeParse({ ogImage: 'https://example.com/og.png' }).success).toBe(true);
  });
});

describe('writingUpdateSchema', () => {
  it('allows a partial payload', () => {
    expect(writingUpdateSchema.safeParse({ featured: true }).success).toBe(true);
    expect(writingUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('still validates the fields that are present', () => {
    expect(writingUpdateSchema.safeParse({ title: '' }).success).toBe(false);
    expect(writingUpdateSchema.safeParse({ primaryCategory: 'NOPE' }).success).toBe(false);
  });
});

describe('writingQuerySchema', () => {
  it('applies pagination and sort defaults', () => {
    const parsed = writingQuerySchema.parse({});
    expect(parsed).toMatchObject({ page: 1, limit: 12, sort: 'newest' });
  });

  it('parses a full filter set from query-string shapes', () => {
    const parsed = writingQuerySchema.parse({
      q: '  nothingness  ',
      categories: 'LOVE_LONGING,ABSENCE_LOSS',
      themes: 'grief',
      emotions: 'melancholy',
      language: 'HINDI',
      tags: 'monsoon',
      featured: 'true',
      page: '2',
      limit: '24',
      sort: 'oldest',
    });
    expect(parsed.q).toBe('nothingness');
    expect(parsed.categories).toEqual(['LOVE_LONGING', 'ABSENCE_LOSS']);
    expect(parsed.featured).toBe(true);
    expect(parsed.page).toBe(2);
  });

  it('accepts a Devanagari search term', () => {
    expect(writingQuerySchema.parse({ q: 'तन्हाई' }).q).toBe('तन्हाई');
  });

  it('rejects an unknown sort', () => {
    expect(writingQuerySchema.safeParse({ sort: 'random' }).success).toBe(false);
  });

  it('rejects a search term beyond the length limit', () => {
    expect(writingQuerySchema.safeParse({ q: 'a'.repeat(201) }).success).toBe(false);
  });
});
