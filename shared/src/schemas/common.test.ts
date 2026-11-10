import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  booleanParam,
  emailSchema,
  categoryKeySchema,
  csvArray,
  cursorPaginationSchema,
  emotionKeySchema,
  languageKeySchema,
  objectIdSchema,
  paginationSchema,
  slugSchema,
  themeKeySchema,
} from './common.js';

/** csvArray is only ever used inside an object, so test it the way it is used. */
const query = z.object({ categories: csvArray(categoryKeySchema) });
const tagQuery = z.object({ tags: csvArray(z.string().min(1).max(40)) });

describe('csvArray', () => {
  it('splits a comma-separated string', () => {
    expect(query.parse({ categories: 'LOVE_LONGING,GRIEF_MELANCHOLY' }).categories).toEqual([
      'LOVE_LONGING',
      'GRIEF_MELANCHOLY',
    ]);
  });

  it('accepts a repeated query parameter as an array', () => {
    expect(query.parse({ categories: ['LOVE_LONGING', 'EXISTENTIALISM'] }).categories).toEqual([
      'LOVE_LONGING',
      'EXISTENTIALISM',
    ]);
  });

  it('accepts a single value', () => {
    expect(query.parse({ categories: 'EXISTENTIALISM' }).categories).toEqual(['EXISTENTIALISM']);
  });

  it('trims whitespace around each entry', () => {
    expect(query.parse({ categories: ' LOVE_LONGING , GRIEF_MELANCHOLY ' }).categories).toEqual([
      'LOVE_LONGING',
      'GRIEF_MELANCHOLY',
    ]);
  });

  it('de-duplicates while preserving first-seen order', () => {
    expect(
      query.parse({ categories: 'GRIEF_MELANCHOLY,LOVE_LONGING,GRIEF_MELANCHOLY' }).categories,
    ).toEqual(['GRIEF_MELANCHOLY', 'LOVE_LONGING']);
  });

  it('treats an absent parameter as undefined, not an empty array', () => {
    expect(query.parse({}).categories).toBeUndefined();
  });

  it('treats an empty string as undefined', () => {
    expect(query.parse({ categories: '' }).categories).toBeUndefined();
  });

  it('treats a string of only separators and spaces as undefined', () => {
    expect(query.parse({ categories: ' , ,, ' }).categories).toBeUndefined();
  });

  it('treats an empty array as undefined', () => {
    expect(query.parse({ categories: [] }).categories).toBeUndefined();
  });

  it('rejects a value that is not in the enum', () => {
    const result = query.safeParse({ categories: 'LOVE_LONGING,NOT_A_CATEGORY' });
    expect(result.success).toBe(false);
  });

  it('rejects a lowercase enum key, because keys are case-sensitive', () => {
    expect(query.safeParse({ categories: 'love_longing' }).success).toBe(false);
  });

  it('ignores non-string entries in an array rather than stringifying them', () => {
    // `String({})` would yield "[object Object]" and silently become a filter value.
    expect(
      query.parse({ categories: [1, {}, null] as unknown as string[] }).categories,
    ).toBeUndefined();
  });

  it('ignores an object, rather than coercing it to a string', () => {
    expect(
      query.parse({ categories: { evil: true } as unknown as string }).categories,
    ).toBeUndefined();
  });

  it('carries free-text values through for tag filters', () => {
    expect(tagQuery.parse({ tags: 'monsoon, मौन ,silence' }).tags).toEqual([
      'monsoon',
      'मौन',
      'silence',
    ]);
  });

  it('rejects a tag longer than the limit', () => {
    expect(tagQuery.safeParse({ tags: 'a'.repeat(41) }).success).toBe(false);
  });
});

describe('booleanParam', () => {
  const schema = z.object({ featured: booleanParam });

  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
  ])('coerces %s to %s', (input, expected) => {
    expect(schema.parse({ featured: input }).featured).toBe(expected);
  });

  it('passes a real boolean through', () => {
    expect(schema.parse({ featured: true }).featured).toBe(true);
    expect(schema.parse({ featured: false }).featured).toBe(false);
  });

  it('is undefined when absent', () => {
    expect(schema.parse({}).featured).toBeUndefined();
  });

  it.each(['yes', 'no', 'TRUE', '2', ''])('rejects the ambiguous value %o', (input) => {
    expect(schema.safeParse({ featured: input }).success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('applies defaults', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 12 });
  });

  it('coerces numeric strings from the query string', () => {
    expect(paginationSchema.parse({ page: '3', limit: '24' })).toEqual({ page: 3, limit: 24 });
  });

  it.each([
    ['page', 0],
    ['page', -1],
    ['limit', 0],
    ['limit', 61],
  ])('rejects %s = %s', (field, value) => {
    expect(paginationSchema.safeParse({ [field]: value }).success).toBe(false);
  });

  it('rejects a fractional page', () => {
    expect(paginationSchema.safeParse({ page: 1.5 }).success).toBe(false);
  });

  it('rejects text that is not a number', () => {
    expect(paginationSchema.safeParse({ page: 'two' }).success).toBe(false);
  });

  it('caps limit so a client cannot request the whole archive', () => {
    expect(paginationSchema.safeParse({ limit: 1000 }).success).toBe(false);
  });
});

describe('cursorPaginationSchema', () => {
  it('defaults the limit and leaves the cursor absent', () => {
    expect(cursorPaginationSchema.parse({})).toEqual({ limit: 24 });
  });

  it('rejects an over-long cursor', () => {
    expect(cursorPaginationSchema.safeParse({ cursor: 'x'.repeat(513) }).success).toBe(false);
  });
});

describe('slugSchema', () => {
  it.each([
    'existing-without-belonging',
    'you-are-the-hope-i-am-the-hopeless',
    'before-returning-to-nothingness',
    'a',
    'poem-2',
  ])('accepts %s', (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it.each([
    ['', 'empty'],
    ['Existing-Without-Belonging', 'uppercase'],
    ['existing--without', 'double hyphen'],
    ['-leading', 'leading hyphen'],
    ['trailing-', 'trailing hyphen'],
    ['has space', 'space'],
    ['has_underscore', 'underscore'],
    ['has.dot', 'dot'],
    ['slash/slug', 'slash'],
    ['../../etc/passwd', 'traversal'],
  ])('rejects %o (%s)', (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });

  it('rejects a slug longer than 140 characters', () => {
    expect(slugSchema.safeParse('a'.repeat(141)).success).toBe(false);
  });

  /**
   * Documented consequence, not an accident: slugs are ASCII-only, so a Devanagari
   * title cannot become a slug by lowercasing. Hindi writings need transliteration or
   * a manually supplied slug. The CMS must therefore never silently derive an empty
   * slug from a Hindi title.
   */
  it('rejects a Devanagari slug, which forces Hindi titles to be transliterated', () => {
    expect(slugSchema.safeParse('तन्हाई').success).toBe(false);
  });
});

describe('objectIdSchema', () => {
  it('accepts a 24-character hex id', () => {
    expect(objectIdSchema.safeParse('507f1f77bcf86cd799439011').success).toBe(true);
  });

  it.each(['507f1f77bcf86cd79943901', '507f1f77bcf86cd7994390111', 'zzzf1f77bcf86cd799439011', ''])(
    'rejects %o',
    (id) => {
      expect(objectIdSchema.safeParse(id).success).toBe(false);
    },
  );
});

describe('taxonomy enums', () => {
  it('accept known keys', () => {
    expect(categoryKeySchema.parse('MORTALITY_NOTHINGNESS')).toBe('MORTALITY_NOTHINGNESS');
    expect(themeKeySchema.parse('unrequited-love')).toBe('unrequited-love');
    expect(emotionKeySchema.parse('melancholy')).toBe('melancholy');
    expect(languageKeySchema.parse('HINGLISH')).toBe('HINGLISH');
  });

  it('reject unknown keys', () => {
    expect(categoryKeySchema.safeParse('SADNESS').success).toBe(false);
    expect(themeKeySchema.safeParse('unrequited love').success).toBe(false);
    expect(emotionKeySchema.safeParse('Melancholy').success).toBe(false);
    expect(languageKeySchema.safeParse('hi').success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('accepts an ordinary address', () => {
    expect(emailSchema.parse('reader@example.com')).toBe('reader@example.com');
  });

  it('normalises case', () => {
    expect(emailSchema.parse('Reader@Example.COM')).toBe('reader@example.com');
  });

  it('normalises before validating, so a pasted address still works', () => {
    expect(emailSchema.parse('  reader@example.com\n')).toBe('reader@example.com');
    expect(emailSchema.parse('\treader@example.com ')).toBe('reader@example.com');
  });

  it.each(['', 'nope', '@example.com', 'a@@b.co', 'a b@example.com'])('rejects %o', (value) => {
    expect(emailSchema.safeParse(value).success).toBe(false);
  });

  it('bounds the length after trimming', () => {
    expect(emailSchema.safeParse(`${'a'.repeat(250)}@b.co`).success).toBe(false);
  });

  it('rejects a non-string', () => {
    expect(emailSchema.safeParse(42).success).toBe(false);
    expect(emailSchema.safeParse(null).success).toBe(false);
  });
});
