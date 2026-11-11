import {
  Archivo,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Spectral,
  Tiro_Devanagari_Hindi,
} from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Five roles, five families (ARCHITECTURE §3.3). The CSS variables declared here are
 * consumed by `--font-*` in tokens.css; components never name a family directly.
 *
 * Only the three families the literary pages need are preloaded. Devanagari loads on
 * demand for Hindi writings, and the ABYSS faces only on /abyss — keeping the reading
 * route inside its first-load budget (§12).
 */

/** Display: literary, manuscript-adjacent. Used large, light and widely tracked. */
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

/** Reading (Latin): built for long-form on screen. */
export const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

/** Reading (Devanagari): a face actually designed for Hindi poetry. */
export const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ['devanagari', 'latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-tiro-deva',
  display: 'swap',
  preload: false,
});

/** UI: navigation, filters, metadata, admin. */
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

/** Metadata: dates, categories, numbering, small labels. */
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-geist-mono',
  display: 'swap',
});

/**
 * ABYSS wordmark only — never body text. Aquiline Two, by Manfred Klein + CybaPee
 * (based on Aquiline by Expert Software), distributed as "100% Free" on DaFont;
 * embedding unrestricted (fsType 0). Subset to Latin and served as WOFF2 (36 KB).
 */
export const aquiline = localFont({
  src: '../fonts/aquiline-two.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-aquiline',
  display: 'swap',
  preload: false,
});

/** ABYSS interface: condensed, uppercase, brutalist register. */
export const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  preload: false,
});

/** Applied to <html> so every `--font-*` token resolves. */
export const fontVariables = [
  cormorant.variable,
  spectral.variable,
  tiroDevanagari.variable,
  geist.variable,
  geistMono.variable,
  aquiline.variable,
  archivo.variable,
].join(' ');
