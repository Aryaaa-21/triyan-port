import { z } from 'zod';
import {
  booleanParam,
  categoryKeySchema,
  csvArray,
  cursorPaginationSchema,
  emotionKeySchema,
  languageKeySchema,
  objectIdSchema,
  themeKeySchema,
} from './common.js';
import { INSTAGRAM_MEDIA_TYPES, INSTAGRAM_PRODUCT_TYPES, SYNC_MODES } from '../taxonomy.js';

export const instagramQuerySchema = cursorPaginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  category: categoryKeySchema.optional(),
  categories: csvArray(categoryKeySchema),
  language: languageKeySchema.optional(),
  mediaType: z.enum(INSTAGRAM_MEDIA_TYPES).optional(),
  productType: z.enum(INSTAGRAM_PRODUCT_TYPES).optional(),
  featured: booleanParam,
  linked: booleanParam,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  /** `oldest` reads the archive from the first post forward. */
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

/**
 * Admin-editable fields on a synced post. Note what is absent: there is no
 * "approve" field. Synced media is live by default (ARCHITECTURE §9.3 / spec §26).
 */
export const instagramAdminUpdateSchema = z.object({
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  important: z.boolean().optional(),
  indexable: z.boolean().optional(),
  displayTitle: z.string().trim().max(200).optional(),
  altText: z.string().trim().max(400).optional(),
  linkedWriting: objectIdSchema.nullable().optional(),
});

/** An admin correcting the classifier. Recorded immutably (spec §21, §39). */
export const classificationOverrideSchema = z.object({
  primaryCategory: categoryKeySchema,
  secondaryCategories: z.array(categoryKeySchema).max(2).default([]),
  themes: z.array(themeKeySchema).max(8).default([]),
  emotions: z.array(emotionKeySchema).max(8).default([]),
  language: languageKeySchema.optional(),
  note: z.string().trim().max(500).optional(),
});

export const syncRequestSchema = z.object({
  mode: z.enum(SYNC_MODES).default('INCREMENTAL'),
});

/** Reclassification is destructive to derived data, so confirmation is mandatory (spec §61). */
export const reclassifyRequestSchema = z.object({
  confirm: z.literal(true, { message: 'Reclassification must be explicitly confirmed' }),
  scope: z.enum(['ALL', 'SELECTED', 'NEEDS_REVIEW']).default('NEEDS_REVIEW'),
  ids: z.array(objectIdSchema).max(500).default([]),
  /** Manual overrides are preserved unless this is explicitly set. */
  includeManualOverrides: z.boolean().default(false),
});

export type InstagramQuery = z.infer<typeof instagramQuerySchema>;
export type InstagramAdminUpdate = z.infer<typeof instagramAdminUpdateSchema>;
export type ClassificationOverride = z.infer<typeof classificationOverrideSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;
export type ReclassifyRequest = z.infer<typeof reclassifyRequestSchema>;
