/**
 * The single source of truth for Triyan's literary taxonomy.
 *
 * Both the Next.js client and the Express server import from here. Nothing may
 * introduce a category, theme, emotion or language that is not declared in this file:
 * the Mongoose schemas, the zod validators, the classifier lexicons and the UI filters
 * are all constrained by these unions.
 *
 * `label` and `description` are editorial defaults. They are overridable per-category
 * from the admin panel (the Category collection stores the live values); they are not
 * factual claims and contain no invented information about Triyan or his work.
 */

/* ------------------------------------------------------------------ categories */

export const CATEGORY_KEYS = [
  'LOVE_LONGING',
  'ABSENCE_LOSS',
  'GRIEF_MELANCHOLY',
  'EXISTENTIALISM',
  'MORTALITY_NOTHINGNESS',
  'HOPE_DESPAIR',
  'HUMAN_CONDITION',
  'PHILOSOPHICAL_REFLECTIONS',
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryDefinition {
  readonly key: CategoryKey;
  readonly label: string;
  readonly slug: string;
  readonly order: number;
  readonly description: string;
}

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    key: 'LOVE_LONGING',
    label: 'Love & Longing',
    slug: 'love-and-longing',
    order: 1,
    description: 'Wanting, and the distance that wanting needs in order to exist.',
  },
  {
    key: 'ABSENCE_LOSS',
    label: 'Absence & Loss',
    slug: 'absence-and-loss',
    order: 2,
    description: 'What remains in the shape of what left.',
  },
  {
    key: 'GRIEF_MELANCHOLY',
    label: 'Grief & Melancholy',
    slug: 'grief-and-melancholy',
    order: 3,
    description: 'Sorrow kept long enough to become a way of seeing.',
  },
  {
    key: 'EXISTENTIALISM',
    label: 'Existentialism',
    slug: 'existentialism',
    order: 4,
    description: 'Being, choosing, and the silence that answers neither.',
  },
  {
    key: 'MORTALITY_NOTHINGNESS',
    label: 'Mortality & Nothingness',
    slug: 'mortality-and-nothingness',
    order: 5,
    description: 'The end as a fact, and the end as a question.',
  },
  {
    key: 'HOPE_DESPAIR',
    label: 'Hope & Despair',
    slug: 'hope-and-despair',
    order: 6,
    description: 'Two names that keep turning out to be one.',
  },
  {
    key: 'HUMAN_CONDITION',
    label: 'Human Condition',
    slug: 'human-condition',
    order: 7,
    description: 'What it costs to be a person among people.',
  },
  {
    key: 'PHILOSOPHICAL_REFLECTIONS',
    label: 'Philosophical Reflections',
    slug: 'philosophical-reflections',
    order: 8,
    description: 'Thought following itself past the point of comfort.',
  },
];

/* --------------------------------------------------------------------- themes */

export const THEME_KEYS = [
  'love',
  'unrequited-love',
  'longing',
  'separation',
  'loss',
  'grief',
  'death',
  'mortality',
  'existence',
  'nothingness',
  'faith',
  'hope',
  'despair',
  'loneliness',
  'nostalgia',
  'memory',
  'identity',
  'suffering',
  'human-nature',
  'time',
] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

/* ------------------------------------------------------------------- emotions */

export const EMOTION_KEYS = [
  'love',
  'longing',
  'sadness',
  'grief',
  'despair',
  'hope',
  'anger',
  'peace',
  'nostalgia',
  'loneliness',
  'acceptance',
  'fear',
  'confusion',
  'melancholy',
] as const;

export type EmotionKey = (typeof EMOTION_KEYS)[number];

/* ------------------------------------------------------------------ languages */

export const LANGUAGE_KEYS = ['ENGLISH', 'HINDI', 'HINGLISH', 'UNKNOWN'] as const;
export type LanguageKey = (typeof LANGUAGE_KEYS)[number];

/** Script used to render a piece of writing — drives font selection on the reading page. */
export const SCRIPT_BY_LANGUAGE: Readonly<Record<LanguageKey, 'latin' | 'devanagari'>> = {
  ENGLISH: 'latin',
  HINDI: 'devanagari',
  HINGLISH: 'latin',
  UNKNOWN: 'latin',
};

/* --------------------------------------------------------------- content type */

export const CONTENT_TYPE_KEYS = [
  'POEM',
  'PROSE',
  'APHORISM',
  'FRAGMENT',
  'REFLECTION',
  'UNKNOWN',
] as const;
export type ContentTypeKey = (typeof CONTENT_TYPE_KEYS)[number];

/* ------------------------------------------------------ classification method */

export const CLASSIFICATION_METHODS = ['RULES', 'EMBEDDING', 'LLM', 'ENSEMBLE', 'MANUAL'] as const;
export type ClassificationMethod = (typeof CLASSIFICATION_METHODS)[number];

/**
 * Below this confidence a classification is flagged `needsReview` and surfaced in the
 * admin review queue. Automatic classification is never silently trusted (ARCHITECTURE §8.5).
 */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.55;

/* ------------------------------------------------------------------ instagram */

export const INSTAGRAM_MEDIA_TYPES = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'] as const;
export type InstagramMediaType = (typeof INSTAGRAM_MEDIA_TYPES)[number];

export const INSTAGRAM_PRODUCT_TYPES = ['FEED', 'REELS', 'STORY', 'AD', 'UNKNOWN'] as const;
export type InstagramProductType = (typeof INSTAGRAM_PRODUCT_TYPES)[number];

export const SYNC_HEALTH_STATES = [
  'NEVER_RUN',
  'HEALTHY',
  'RUNNING',
  'DEGRADED',
  'FAILED',
  'TOKEN_EXPIRED',
] as const;
export type SyncHealthState = (typeof SYNC_HEALTH_STATES)[number];

export const SYNC_MODES = ['FULL', 'INCREMENTAL'] as const;
export type SyncMode = (typeof SYNC_MODES)[number];

/* ------------------------------------------------------------------- lookups */

const CATEGORY_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));
const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export const getCategory = (key: string): CategoryDefinition | undefined =>
  CATEGORY_BY_KEY.get(key as CategoryKey);

export const getCategoryBySlug = (slug: string): CategoryDefinition | undefined =>
  CATEGORY_BY_SLUG.get(slug);

export const isCategoryKey = (value: unknown): value is CategoryKey =>
  typeof value === 'string' && CATEGORY_BY_KEY.has(value as CategoryKey);

export const isThemeKey = (value: unknown): value is ThemeKey =>
  typeof value === 'string' && (THEME_KEYS as readonly string[]).includes(value);

export const isEmotionKey = (value: unknown): value is EmotionKey =>
  typeof value === 'string' && (EMOTION_KEYS as readonly string[]).includes(value);

/** Human-readable label for a theme or emotion key: `unrequited-love` -> `Unrequited love`. */
export const humanizeKey = (key: string): string => {
  const spaced = key.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};
