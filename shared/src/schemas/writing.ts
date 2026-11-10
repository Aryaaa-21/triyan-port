import { z } from 'zod';
import {
  booleanParam,
  categoryKeySchema,
  contentTypeKeySchema,
  csvArray,
  emotionKeySchema,
  languageKeySchema,
  objectIdSchema,
  paginationSchema,
  slugSchema,
  themeKeySchema,
  writingStatusSchema,
} from './common.js';

export const WRITING_SORTS = ['newest', 'oldest', 'title', 'relevance'] as const;

export const seoSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(180).optional(),
  ogImage: z.url().optional(),
  noindex: z.boolean().default(false),
});

/** Admin payload for creating or editing a writing. */
export const writingInputSchema = z.object({
  title: z.string().trim().min(1, 'A title is required').max(200),
  slug: slugSchema.optional(),
  content: z.string().min(1, 'A writing cannot be empty').max(60_000),
  excerpt: z.string().max(400).optional(),
  language: languageKeySchema.default('UNKNOWN'),
  contentType: contentTypeKeySchema.default('POEM'),
  primaryCategory: categoryKeySchema.optional(),
  secondaryCategories: z.array(categoryKeySchema).max(2).default([]),
  themes: z.array(themeKeySchema).max(8).default([]),
  emotions: z.array(emotionKeySchema).max(8).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  featured: z.boolean().default(false),
  status: writingStatusSchema.default('DRAFT'),
  publishedAt: z.coerce.date().optional(),
  bookExclusive: z.boolean().default(false),
  coverImage: objectIdSchema.optional(),
  instagramMedia: z.array(objectIdSchema).max(20).default([]),
  seo: seoSchema.default({ noindex: false }),
});

export const writingUpdateSchema = writingInputSchema.partial();

/** Public archive query. Mirrors the filters in ARCHITECTURE §6.1. */
export const writingQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  category: categoryKeySchema.optional(),
  categories: csvArray(categoryKeySchema),
  themes: csvArray(themeKeySchema),
  emotions: csvArray(emotionKeySchema),
  language: languageKeySchema.optional(),
  tags: csvArray(z.string().min(1).max(40)),
  featured: booleanParam,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(WRITING_SORTS).default('newest'),
});

export type WritingInput = z.infer<typeof writingInputSchema>;
export type WritingUpdate = z.infer<typeof writingUpdateSchema>;
export type WritingQuery = z.infer<typeof writingQuerySchema>;
export type Seo = z.infer<typeof seoSchema>;
