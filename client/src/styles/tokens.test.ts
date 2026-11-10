/**
 * The design system's contract, enforced.
 *
 * 1. Every colour token exists in both environments.
 * 2. Every contrast pair meets its threshold in both environments.
 * 3. No colour literal exists anywhere outside tokens.css.
 *
 * A token change that hurts legibility therefore fails the build rather than
 * shipping quietly (ARCHITECTURE §3.2).
 *
 * @vitest-environment node
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';
import { THEME_META_COLORS } from '../lib/theme';

const CLIENT_SRC = join(import.meta.dirname, '..');
const TOKENS_PATH = join(CLIENT_SRC, 'styles/tokens.css');
const tokensCss = readFileSync(TOKENS_PATH, 'utf8');

/** Extracts the custom properties declared in the block introduced by `selector`. */
const blockTokens = (selector: string): Record<string, string> => {
  const index = tokensCss.indexOf(selector);
  if (index === -1) throw new Error(`tokens.css has no block for ${selector}`);

  const open = tokensCss.indexOf('{', index);
  const close = tokensCss.indexOf('\n}', open);
  const body = tokensCss.slice(open + 1, close);

  const out: Record<string, string> = {};
  for (const match of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) out[name] = value.trim();
  }
  return out;
};

const VOID = blockTokens(":root[data-theme='void']");
const MANUSCRIPT = blockTokens(":root[data-theme='manuscript']");
const ROOT = blockTokens(':root {');

const COLOUR_TOKENS = [
  'bg',
  'bg-raised',
  'surface',
  'border',
  'border-strong',
  'fg',
  'fg-muted',
  'fg-subtle',
  'accent',
  'ember',
  'focus',
] as const;

/**
 * Thresholds follow WCAG 2.1. Body copy is held to AAA because the product *is*
 * reading; `fg-subtle` carries secondary metadata only, and `focus` carries the
 * 1.4.11 non-text requirement so decorative borders can stay faint.
 */
const PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['fg', 'bg', 7],
  ['fg', 'bg-raised', 7],
  ['fg', 'surface', 7],
  ['fg-muted', 'bg', 4.5],
  ['fg-muted', 'bg-raised', 4.5],
  ['fg-muted', 'surface', 4.5],
  ['fg-subtle', 'bg', 3],
  ['fg-subtle', 'surface', 3],
  ['accent', 'bg', 4.5],
  ['ember', 'bg', 3],
  ['focus', 'bg', 3],
  ['focus', 'surface', 3],
  ['border-strong', 'bg', 1.5],
  ['border', 'bg', 1.2],
];

const ENVIRONMENTS = { VOID, MANUSCRIPT } as const;

describe('design tokens', () => {
  it('declares VOID as the default on :root', () => {
    expect(ROOT['bg']).toBe(VOID['bg']);
    expect(ROOT['fg']).toBe(VOID['fg']);
    expect(ROOT['color-scheme']).toBeUndefined(); // color-scheme is a property, not a token
  });

  for (const [name, tokens] of Object.entries(ENVIRONMENTS)) {
    describe(name, () => {
      it.each(COLOUR_TOKENS)('defines --%s', (token) => {
        expect(tokens[token], `${name} is missing --${token}`).toMatch(/^#[0-9a-f]{3,8}$/i);
      });

      it.each(PAIRS)('%s on %s meets %s:1', (fg, bg, min) => {
        const foreground = tokens[fg];
        const background = tokens[bg];
        expect(foreground, `${name} is missing --${fg}`).toBeDefined();
        expect(background, `${name} is missing --${bg}`).toBeDefined();

        const ratio = contrastRatio(foreground as string, background as string);
        expect(
          Number(ratio.toFixed(2)),
          `${name}: --${fg} on --${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`,
        ).toBeGreaterThanOrEqual(min);
      });
    });
  }

  it('keeps the browser chrome colour in step with each environment', () => {
    expect(THEME_META_COLORS.void).toBe(VOID['bg']);
    expect(THEME_META_COLORS.manuscript).toBe(MANUSCRIPT['bg']);
  });

  it('keeps the two environments genuinely distinct, not inverted', () => {
    // An inversion would make every pair's ratio identical between environments.
    const ratios = (tokens: Record<string, string>) =>
      PAIRS.map(([fg, bg]) => contrastRatio(tokens[fg] as string, tokens[bg] as string).toFixed(2));
    expect(ratios(VOID)).not.toEqual(ratios(MANUSCRIPT));
  });
});

/* ------------------------------------------------------------------------- */

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css'];
/** theme.ts holds the browser-chrome colours, which cannot be CSS variables. */
const EXEMPT = new Set(['styles/tokens.css', 'lib/theme.ts']);

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
};

describe('token discipline', () => {
  it('has no colour literal outside tokens.css', () => {
    const offenders: string[] = [];

    for (const file of walk(CLIENT_SRC)) {
      const rel = relative(CLIENT_SRC, file).replace(/\\/g, '/');
      if (EXEMPT.has(rel) || rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;

      const source = readFileSync(file, 'utf8');
      for (const [index, line] of source.split('\n').entries()) {
        const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
        if (/#[0-9a-fA-F]{3,8}\b/.test(stripped) || /\b(rgb|rgba|hsl|hsla)\(/.test(stripped)) {
          offenders.push(`${rel}:${index + 1}  ${line.trim()}`);
        }
      }
    }

    expect(offenders, `Colour literals belong in tokens.css:\n${offenders.join('\n')}`).toEqual([]);
  });
});
