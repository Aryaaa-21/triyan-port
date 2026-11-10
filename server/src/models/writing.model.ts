import { Schema, model, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';
import {
  CATEGORY_KEYS,
  CONTENT_TYPE_KEYS,
  EMOTION_KEYS,
  LANGUAGE_KEYS,
  THEME_KEYS,
  WRITING_STATUSES,
} from '@triyan/shared';

/**
 * Writing — the canonical literary object and the reason this project exists.
 *
 * Instagram media and the book are *channels* that reference a Writing; the Writing
 * itself is never duplicated per channel (ARCHITECTURE §0 D7).
 *
 * The single most important property of this schema: **`content` is stored verbatim.**
 * It is not trimmed, normalised or collapsed. Line breaks, blank lines between stanzas,
 * leading indentation and typographic punctuation are the poem, not formatting applied
 * to it. Mongoose trims strings only when told to, and this field never is.
 */

const seoSchema = new Schema(
  {
    title: { type: String, maxlength: 70, trim: true },
    description: { type: String, maxlength: 180, trim: true },
    ogImage: { type: String, trim: true },
    noindex: { type: Boolean, default: false },
  },
  { _id: false },
);

const writingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 140,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and hyphen-separated'],
    },

    /** Verbatim. See the note above — do not add `trim` here. */
    content: { type: String, required: true, maxlength: 60_000 },

    excerpt: { type: String, maxlength: 400, trim: true },

    language: { type: String, enum: LANGUAGE_KEYS, default: 'UNKNOWN', index: true },
    contentType: { type: String, enum: CONTENT_TYPE_KEYS, default: 'POEM' },

    primaryCategory: { type: String, enum: CATEGORY_KEYS, default: null },
    secondaryCategories: {
      type: [{ type: String, enum: CATEGORY_KEYS }],
      default: [],
      validate: [(v: string[]) => v.length <= 2, 'At most two secondary categories'],
    },
    themes: {
      type: [{ type: String, enum: THEME_KEYS }],
      default: [],
      validate: [(v: string[]) => v.length <= 8, 'At most eight themes'],
    },
    emotions: {
      type: [{ type: String, enum: EMOTION_KEYS }],
      default: [],
      validate: [(v: string[]) => v.length <= 8, 'At most eight emotions'],
    },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: [(v: string[]) => v.length <= 20, 'At most twenty tags'],
    },

    status: { type: String, enum: WRITING_STATUSES, default: 'DRAFT', required: true },
    featured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    /** Book-exclusive writings must never become public through any channel (spec §33). */
    bookExclusive: { type: Boolean, default: false },

    seo: { type: seoSchema, default: () => ({ noindex: false }) },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Publication time is derived, never trusted from the client: it is stamped the first
 * time a writing becomes PUBLISHED and preserved across later edits, so editing a
 * published poem does not silently reorder the archive.
 */
// Mongoose 9 middleware is promise-based; there is no `next` callback. A synchronous
// hook is fine — returning undefined is treated as completion.
writingSchema.pre('save', function assignPublishedAt() {
  if (this.status === 'PUBLISHED' && !this.publishedAt) this.publishedAt = new Date();
});

/* ------------------------------------------------------------------- indexes */

// The public archive's default query: published, newest first.
writingSchema.index({ status: 1, publishedAt: -1 });
// Featured rail on the homepage.
writingSchema.index({ status: 1, featured: 1, publishedAt: -1 });
// Category landing and filter.
writingSchema.index({ status: 1, primaryCategory: 1, publishedAt: -1 });
// Multikey indexes for the theme/emotion/tag filters.
writingSchema.index({ themes: 1 });
writingSchema.index({ emotions: 1 });
writingSchema.index({ tags: 1 });
// Guards the invariant that a book-exclusive writing is never served publicly.
writingSchema.index({ bookExclusive: 1, status: 1 });

/**
 * Full-text search.
 *
 * `default_language: 'none'` disables stemming and stop-word removal, which is
 * deliberate: the English stemmer would mangle Devanagari tokens, and this archive is
 * bilingual. Exact-token matching across both scripts is the right trade at this size.
 *
 * `language_override` matters more than it looks. By default MongoDB treats a field
 * literally named `language` as a per-document text-search language, so our
 * `language: 'HINDI'` would be read as a search language, rejected as unsupported, and
 * **every write to this collection would fail**. Pointing the override at a field name
 * that is never set leaves our taxonomy field alone.
 */
writingSchema.index(
  { title: 'text', excerpt: 'text', content: 'text', tags: 'text' },
  {
    name: 'writing_text',
    default_language: 'none',
    language_override: 'textSearchLanguage',
    weights: { title: 10, excerpt: 5, tags: 4, content: 1 },
  },
);

export type WritingAttrs = InferSchemaType<typeof writingSchema>;
export type WritingDoc = HydratedDocument<WritingAttrs>;
export type WritingModel = Model<WritingAttrs>;

export const Writing: WritingModel = model<WritingAttrs>('Writing', writingSchema);
