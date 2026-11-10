import { z } from 'zod';
import {
  CATEGORY_KEYS,
  CONTENT_TYPE_KEYS,
  EMOTION_KEYS,
  LANGUAGE_KEYS,
  THEME_KEYS,
} from '../taxonomy.js';

export const categoryKeySchema = z.enum(CATEGORY_KEYS);
export const themeKeySchema = z.enum(THEME_KEYS);
export const emotionKeySchema = z.enum(EMOTION_KEYS);
export const languageKeySchema = z.enum(LANGUAGE_KEYS);
export const contentTypeKeySchema = z.enum(CONTENT_TYPE_KEYS);

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a 24-character hex object id');

/**
 * The one email schema. Normalisation happens *before* validation on purpose:
 * `z.email()` runs its check against the raw input, so trimming afterwards would
 * reject a pasted address carrying whitespace and report it as malformed — a login
 * failure the reader cannot diagnose and cannot fix.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('That does not look like an email address').max(254));

export const slugSchema = z
  .string()
  .min(1)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase hyphenated slug');

/**
 * Accepts `a,b,c`, a repeated query parameter, or nothing, and always yields a
 * de-duplicated array validated against `item`. Used by every archive filter.
 */
export const csvArray = <T extends z.ZodType>(item: T) =>
  z.preprocess((value) => {
    const raw: string[] =
      typeof value === 'string'
        ? value.split(',')
        : Array.isArray(value)
          ? value.filter((entry): entry is string => typeof entry === 'string')
          : [];
    const parts = raw.map((part) => part.trim()).filter((part) => part.length > 0);
    return parts.length > 0 ? Array.from(new Set(parts)) : undefined;
  }, z.array(item).optional());

export const booleanParam = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

export type Pagination = z.infer<typeof paginationSchema>;
export type CursorPagination = z.infer<typeof cursorPaginationSchema>;
