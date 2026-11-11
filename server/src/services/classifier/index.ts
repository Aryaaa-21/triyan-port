import {
  CATEGORY_KEYS,
  CONFIDENCE_REVIEW_THRESHOLD,
  type CategoryKey,
  type ClassificationMethod,
  type EmotionKey,
  type LanguageKey,
  type ThemeKey,
} from '@triyan/shared';
import { detectLanguage, tokenize } from './language.js';
import { EMOTION_RULES, THEME_RULES, THEME_TO_CATEGORY, type Rule } from './lexicon.js';

export interface ClassificationInput {
  text: string;
}

export interface ClassificationResult {
  primaryCategory: CategoryKey | null;
  secondaryCategories: CategoryKey[];
  themes: ThemeKey[];
  emotions: EmotionKey[];
  language: LanguageKey;
  confidence: number;
  needsReview: boolean;
  method: ClassificationMethod;
  classifierVersion: string;
}

/**
 * The strategy interface. A semantic or LLM classifier implements the same shape
 * and is swapped in at `getClassifier()`; nothing else in the app changes.
 */
export interface Classifier {
  readonly method: ClassificationMethod;
  readonly version: string;
  classify(input: ClassificationInput): ClassificationResult;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Pads tokens so phrase matching respects word boundaries in any script. */
const normalise = (text: string): string => ` ${tokenize(text.replace(/#/g, ' ')).join(' ')} `;

const score = (haystack: string, rules: readonly Rule[]): number => {
  let total = 0;
  for (const [term, weight] of rules) {
    const needle = ` ${tokenize(term).join(' ')} `;
    if (needle.trim() && haystack.includes(needle)) total += weight;
  }
  return total;
};

const ranked = <K extends string>(scores: Map<K, number>, min: number): K[] =>
  [...scores.entries()]
    .filter(([, value]) => value >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

export const rulesClassifier: Classifier = {
  method: 'RULES',
  version: 'rules-1.0.0',

  classify({ text }) {
    const caption = typeof text === 'string' ? text : '';
    const language = detectLanguage(caption);
    const haystack = normalise(caption);

    const themeScores = new Map<ThemeKey, number>();
    for (const [theme, rules] of Object.entries(THEME_RULES) as [ThemeKey, readonly Rule[]][]) {
      const value = score(haystack, rules);
      if (value > 0) themeScores.set(theme, value);
    }

    const emotionScores = new Map<EmotionKey, number>();
    for (const [emotion, rules] of Object.entries(EMOTION_RULES) as [
      EmotionKey,
      readonly Rule[],
    ][]) {
      const value = score(haystack, rules);
      if (value > 0) emotionScores.set(emotion, value);
    }

    const categoryScores = new Map<CategoryKey, number>(CATEGORY_KEYS.map((k) => [k, 0]));
    for (const [theme, value] of themeScores) {
      for (const [category, weight] of THEME_TO_CATEGORY[theme]) {
        categoryScores.set(category, (categoryScores.get(category) ?? 0) + value * weight);
      }
    }

    const categories = ranked(categoryScores, 0.5);
    const primary = categories[0] ?? null;
    const top = primary ? (categoryScores.get(primary) ?? 0) : 0;
    const second = categories[1] ? (categoryScores.get(categories[1]) ?? 0) : 0;

    // Strength: how much evidence there is. Margin: how clearly the winner wins.
    const strength = Math.min(1, top / 6);
    const margin = top === 0 ? 0 : (top - second) / top;
    const confidence = primary ? round(strength * 0.65 + margin * 0.35) : 0;

    return {
      primaryCategory: primary,
      secondaryCategories: categories
        .slice(1, 3)
        .filter((c) => (categoryScores.get(c) ?? 0) >= top * 0.4),
      themes: ranked(themeScores, 1).slice(0, 8),
      emotions: ranked(emotionScores, 1).slice(0, 8),
      language: language.language,
      confidence,
      needsReview: primary === null || confidence < CONFIDENCE_REVIEW_THRESHOLD,
      method: 'RULES',
      classifierVersion: this.version,
    };
  },
};

/** Never throws: a classifier failure must not stop a sync. */
export const classifySafely = (
  text: string,
  classifier: Classifier = rulesClassifier,
): ClassificationResult => {
  try {
    return classifier.classify({ text });
  } catch {
    return {
      primaryCategory: null,
      secondaryCategories: [],
      themes: [],
      emotions: [],
      language: 'UNKNOWN',
      confidence: 0,
      needsReview: true,
      method: classifier.method,
      classifierVersion: `${classifier.version}+failed`,
    };
  }
};

export const getClassifier = (): Classifier => rulesClassifier;

export { detectLanguage, tokenize };
