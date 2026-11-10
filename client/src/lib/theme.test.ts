/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  isTheme,
  readStoredTheme,
  storeTheme,
  systemTheme,
  themeInitScript,
} from './theme.js';

afterEach(() => {
  // Un-stub first: a stubbed localStorage has no clear().
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme', () => {
  it('guards unknown values', () => {
    expect(isTheme('void')).toBe(true);
    expect(isTheme('manuscript')).toBe(true);
    expect(isTheme('dark')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('round-trips a stored choice', () => {
    storeTheme('manuscript');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('manuscript');
    expect(readStoredTheme()).toBe('manuscript');
  });

  it('ignores a corrupted stored value instead of applying it', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(readStoredTheme()).toBeNull();
  });

  it('survives storage being unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readStoredTheme()).toBeNull();
    expect(() => storeTheme('void')).not.toThrow();
  });

  it('follows the system preference when nothing is stored', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({ matches: query.includes('light') })),
    );
    expect(systemTheme()).toBe('manuscript');

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({ matches: false })),
    );
    expect(systemTheme()).toBe('void');
  });

  it('defaults to the void', () => {
    expect(DEFAULT_THEME).toBe('void');
  });

  it('writes the environment onto the document element', () => {
    applyTheme('manuscript');
    expect(document.documentElement.getAttribute('data-theme')).toBe('manuscript');
  });

  it('has a pre-paint script that only ever applies a known theme', () => {
    expect(themeInitScript).toContain(THEME_STORAGE_KEY);
    expect(themeInitScript).toContain("'void'");
    expect(themeInitScript).toContain("'manuscript'");
    // Must never throw: a blocked storage read has to leave the page rendering.
    expect(themeInitScript).toContain('catch');
  });
});
