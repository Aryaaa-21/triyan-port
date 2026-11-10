import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_KEYS,
  EMOTION_KEYS,
  THEME_KEYS,
  getCategory,
  getCategoryBySlug,
  humanizeKey,
  isCategoryKey,
} from './taxonomy.js';

describe('taxonomy', () => {
  it('defines exactly one definition per category key', () => {
    expect(CATEGORIES).toHaveLength(CATEGORY_KEYS.length);
    expect(CATEGORIES.map((c) => c.key).sort()).toEqual([...CATEGORY_KEYS].sort());
  });

  it('has unique slugs and a stable display order', () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(CATEGORIES.map((c) => c.order)).toEqual(
      [...CATEGORIES].sort((a, b) => a.order - b.order).map((c) => c.order),
    );
  });

  it('has no duplicate theme or emotion keys', () => {
    expect(new Set(THEME_KEYS).size).toBe(THEME_KEYS.length);
    expect(new Set(EMOTION_KEYS).size).toBe(EMOTION_KEYS.length);
  });

  it('looks categories up by key and by slug', () => {
    expect(getCategory('ABSENCE_LOSS')?.label).toBe('Absence & Loss');
    expect(getCategoryBySlug('absence-and-loss')?.key).toBe('ABSENCE_LOSS');
    expect(getCategory('NOT_A_CATEGORY')).toBeUndefined();
  });

  it('guards unknown category keys', () => {
    expect(isCategoryKey('EXISTENTIALISM')).toBe(true);
    expect(isCategoryKey('existentialism')).toBe(false);
    expect(isCategoryKey(undefined)).toBe(false);
  });

  it('humanizes taxonomy keys for display', () => {
    expect(humanizeKey('unrequited-love')).toBe('Unrequited love');
    expect(humanizeKey('grief')).toBe('Grief');
  });
});
