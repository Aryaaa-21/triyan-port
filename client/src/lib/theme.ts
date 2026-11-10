/**
 * Theme resolution (spec §7):
 *   · first visit  -> follow the operating system
 *   · any choice   -> persisted and honoured on every later visit
 *
 * The attribute is written to <html> by a tiny blocking script so the correct
 * environment paints on the first frame. Without it, a reader who prefers
 * MANUSCRIPT would see a flash of the void.
 */

export const THEMES = ['void', 'manuscript'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = 'triyan.theme';
export const DEFAULT_THEME: Theme = 'void';

export const isTheme = (value: unknown): value is Theme =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value);

export const THEME_LABELS: Readonly<Record<Theme, string>> = {
  void: 'Void',
  manuscript: 'Manuscript',
};

/**
 * `<meta name="theme-color">` must be a literal — the browser chrome cannot read a
 * CSS custom property. This is the only colour literal outside tokens.css, and
 * `tokens.test.ts` asserts these values stay equal to each environment's `--bg`,
 * so the two can never drift apart.
 */
export const THEME_META_COLORS: Readonly<Record<Theme, string>> = {
  void: '#050505',
  manuscript: '#f4f0e8',
};

/**
 * Runs before first paint. Kept deliberately terse — it is inlined into the document.
 * Any failure (private mode, blocked storage) must leave the page rendering, so the
 * whole body is wrapped in a try/catch and simply falls through to the CSS default.
 */
export const themeInitScript = `(function(){try{
var k='${THEME_STORAGE_KEY}',s=localStorage.getItem(k);
if(s==='void'||s==='manuscript'){document.documentElement.setAttribute('data-theme',s);}
}catch(e){}})();`;

export const readStoredTheme = (): Theme | null => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const storeTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable: the choice applies to this page view only.
  }
};

export const systemTheme = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) return DEFAULT_THEME;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'manuscript' : 'void';
};

export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
};
