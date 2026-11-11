import type { LanguageKey } from '@triyan/shared';

/**
 * Script-and-vocabulary language detection. No model, no network.
 *
 * - Mostly Devanagari letters → HINDI
 * - Devanagari mixed with Latin words → HINGLISH
 * - Latin script where enough tokens are romanised Hindi → HINGLISH
 * - Latin script otherwise → ENGLISH
 * - Too little text to judge → UNKNOWN
 */

const DEVANAGARI = /[ऀ-ॿ]/u;
const LATIN = /[A-Za-z]/;

/** Common romanised-Hindi function and content words. Short and unambiguous on purpose. */
const ROMAN_HINDI = new Set([
  'hai',
  'hain',
  'tha',
  'thi',
  'nahi',
  'nahin',
  'mera',
  'meri',
  'mere',
  'tera',
  'teri',
  'tere',
  'tum',
  'tumhe',
  'tumhari',
  'tumse',
  'hum',
  'humein',
  'main',
  'mujhe',
  'mujhse',
  'kya',
  'kyun',
  'kaise',
  'kab',
  'koi',
  'kuch',
  'bhi',
  'yeh',
  'ye',
  'woh',
  'wo',
  'jab',
  'tab',
  'ab',
  'aur',
  'ki',
  'ke',
  'ko',
  'se',
  'mein',
  'par',
  'dil',
  'pyaar',
  'pyar',
  'ishq',
  'mohabbat',
  'zindagi',
  'yaad',
  'yaadein',
  'dard',
  'aansu',
  'raat',
  'chand',
  'sapna',
  'sapne',
  'khuda',
  'rab',
  'maut',
  'tanha',
  'tanhai',
  'judai',
  'intezaar',
  'saath',
  'bichhad',
  'bewafa',
  'jaana',
  'jaan',
  'aankhen',
  'hoon',
  'hu',
  'ho',
  'gaya',
  'gayi',
  'raha',
  'rahi',
  'sakta',
  'sakti',
  'diya',
  'liya',
  'baat',
]);

export interface LanguageResult {
  language: LanguageKey;
  /** 0..1, how sure the script/vocabulary evidence is. */
  confidence: number;
}

export const tokenize = (text: string): string[] =>
  (text.toLowerCase().match(/[\p{L}\p{M}']+/gu) ?? []).map((t) => t.replace(/^'+|'+$/g, ''));

export const detectLanguage = (text: string): LanguageResult => {
  const tokens = tokenize(text).filter((t) => t.length > 0);
  if (tokens.length < 2) return { language: 'UNKNOWN', confidence: 0 };

  let devanagari = 0;
  let latin = 0;
  let romanHindi = 0;
  for (const token of tokens) {
    if (DEVANAGARI.test(token)) devanagari += 1;
    else if (LATIN.test(token)) {
      latin += 1;
      if (ROMAN_HINDI.has(token)) romanHindi += 1;
    }
  }

  const scripted = devanagari + latin;
  if (scripted === 0) return { language: 'UNKNOWN', confidence: 0 };

  const devShare = devanagari / scripted;
  const latinShare = latin / scripted;

  if (devShare >= 0.85) return { language: 'HINDI', confidence: Math.min(1, 0.6 + devShare * 0.4) };
  // Any real mix of the two scripts is Hinglish.
  if (devShare > 0) return { language: 'HINGLISH', confidence: latinShare >= 0.15 ? 0.7 : 0.5 };

  const romanShare = latin === 0 ? 0 : romanHindi / latin;
  if (romanShare >= 0.2) return { language: 'HINGLISH', confidence: Math.min(1, 0.5 + romanShare) };

  // Short Latin text is weak evidence of English specifically.
  const confidence = tokens.length >= 6 ? 0.85 : 0.55;
  return { language: 'ENGLISH', confidence };
};
