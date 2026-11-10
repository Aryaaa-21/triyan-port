import { describe, expect, it } from 'vitest';
import {
  classificationOverrideSchema,
  instagramAdminUpdateSchema,
  instagramQuerySchema,
  reclassifyRequestSchema,
  syncRequestSchema,
} from './instagram.js';

describe('instagramQuerySchema', () => {
  it('defaults the cursor limit', () => {
    expect(instagramQuerySchema.parse({})).toMatchObject({ limit: 24 });
  });

  it('parses media and product type filters', () => {
    const parsed = instagramQuerySchema.parse({ mediaType: 'VIDEO', productType: 'REELS' });
    expect(parsed.mediaType).toBe('VIDEO');
    expect(parsed.productType).toBe('REELS');
  });

  it('rejects an unknown media type', () => {
    expect(instagramQuerySchema.safeParse({ mediaType: 'GIF' }).success).toBe(false);
  });

  it('coerces the linked and featured flags', () => {
    const parsed = instagramQuerySchema.parse({ linked: 'true', featured: '0' });
    expect(parsed.linked).toBe(true);
    expect(parsed.featured).toBe(false);
  });
});

describe('instagramAdminUpdateSchema', () => {
  it('has no approval field, because synced media is live by default', () => {
    const keys = Object.keys(instagramAdminUpdateSchema.shape);
    expect(keys).not.toContain('approved');
    expect(keys).not.toContain('pending');
  });

  it('allows unlinking a writing with an explicit null', () => {
    expect(instagramAdminUpdateSchema.safeParse({ linkedWriting: null }).success).toBe(true);
  });

  it('rejects a linked writing that is not an object id', () => {
    expect(instagramAdminUpdateSchema.safeParse({ linkedWriting: 'nope' }).success).toBe(false);
  });

  it('accepts curation flags', () => {
    expect(
      instagramAdminUpdateSchema.safeParse({ featured: true, hidden: false, important: true })
        .success,
    ).toBe(true);
  });
});

describe('classificationOverrideSchema', () => {
  it('requires a primary category', () => {
    expect(classificationOverrideSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a correction with a note', () => {
    const parsed = classificationOverrideSchema.parse({
      primaryCategory: 'MORTALITY_NOTHINGNESS',
      themes: ['death'],
      emotions: ['melancholy'],
      note: 'Reads as mortality, not existentialism',
    });
    expect(parsed.primaryCategory).toBe('MORTALITY_NOTHINGNESS');
    expect(parsed.secondaryCategories).toEqual([]);
  });

  it('rejects an unknown category', () => {
    expect(classificationOverrideSchema.safeParse({ primaryCategory: 'SADNESS' }).success).toBe(
      false,
    );
  });
});

describe('syncRequestSchema', () => {
  it('defaults to an incremental sync', () => {
    expect(syncRequestSchema.parse({}).mode).toBe('INCREMENTAL');
  });

  it('accepts a full sync', () => {
    expect(syncRequestSchema.parse({ mode: 'FULL' }).mode).toBe('FULL');
  });

  it('rejects an unknown mode', () => {
    expect(syncRequestSchema.safeParse({ mode: 'PARTIAL' }).success).toBe(false);
  });
});

describe('reclassifyRequestSchema', () => {
  it('refuses to run without explicit confirmation', () => {
    expect(reclassifyRequestSchema.safeParse({ scope: 'ALL' }).success).toBe(false);
    expect(reclassifyRequestSchema.safeParse({ confirm: false, scope: 'ALL' }).success).toBe(false);
  });

  it('defaults to the review queue and preserves manual overrides', () => {
    const parsed = reclassifyRequestSchema.parse({ confirm: true });
    expect(parsed.scope).toBe('NEEDS_REVIEW');
    expect(parsed.includeManualOverrides).toBe(false);
  });

  it('bounds the number of ids in one request', () => {
    const ids = Array.from({ length: 501 }, () => '507f1f77bcf86cd799439011');
    expect(
      reclassifyRequestSchema.safeParse({ confirm: true, scope: 'SELECTED', ids }).success,
    ).toBe(false);
  });
});
