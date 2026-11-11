import { Schema, model, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';
import {
  CATEGORY_KEYS,
  CLASSIFICATION_METHODS,
  EMOTION_KEYS,
  INSTAGRAM_MEDIA_TYPES,
  INSTAGRAM_PRODUCT_TYPES,
  LANGUAGE_KEYS,
  THEME_KEYS,
} from '@triyan/shared';

/**
 * A post synced from @triyanwrites through the official API, or imported from the
 * owner's own screenshot archive (`provider: 'archive'`, see docs/INSTAGRAM.md).
 *
 * Posts are live by default — this is not an approval queue. `hidden` is a
 * correction, not a gate. When a post disappears upstream it is marked
 * `available: false` rather than deleted, so history and corrections survive.
 */

const classificationSchema = new Schema(
  {
    primaryCategory: { type: String, enum: CATEGORY_KEYS, default: null },
    secondaryCategories: { type: [{ type: String, enum: CATEGORY_KEYS }], default: [] },
    themes: { type: [{ type: String, enum: THEME_KEYS }], default: [] },
    emotions: { type: [{ type: String, enum: EMOTION_KEYS }], default: [] },
    language: { type: String, enum: LANGUAGE_KEYS, default: 'UNKNOWN' },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    needsReview: { type: Boolean, default: true },
    method: { type: String, enum: CLASSIFICATION_METHODS, default: 'RULES' },
    classifierVersion: { type: String, default: '' },
    classifiedAt: { type: Date, default: null },
  },
  { _id: false },
);

const correctionSchema = new Schema(
  {
    at: { type: Date, default: () => new Date() },
    by: { type: String, default: '' },
    before: { type: classificationSchema },
    after: { type: classificationSchema },
    note: { type: String, maxlength: 500, default: '' },
  },
  { _id: false },
);

const childSchema = new Schema(
  {
    mediaType: { type: String, enum: INSTAGRAM_MEDIA_TYPES },
    mediaUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    mediaWidth: { type: Number, default: 0 },
    mediaHeight: { type: Number, default: 0 },
  },
  { _id: false },
);

const instagramMediaSchema = new Schema(
  {
    sourceId: { type: String, required: true, unique: true },
    provider: { type: String, enum: ['graph', 'mock', 'archive'], required: true },
    permalink: { type: String, default: '' },
    mediaType: { type: String, enum: INSTAGRAM_MEDIA_TYPES, required: true },
    productType: { type: String, enum: INSTAGRAM_PRODUCT_TYPES, default: 'UNKNOWN' },
    /** Verbatim, like a poem: line breaks are content. */
    caption: { type: String, default: '', maxlength: 5_000 },
    captionHash: { type: String, default: '' },
    timestamp: { type: Date, required: true },
    mediaUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    mediaWidth: { type: Number, default: 0 },
    mediaHeight: { type: Number, default: 0 },
    children: { type: [childSchema], default: [] },

    classification: { type: classificationSchema, default: () => ({}) },
    /** Set once an admin corrects the classifier; reclassification then leaves it alone. */
    manualOverride: { type: Boolean, default: false },
    corrections: { type: [correctionSchema], default: [] },

    featured: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    displayTitle: { type: String, default: '', maxlength: 200, trim: true },
    altText: { type: String, default: '', maxlength: 400, trim: true },

    available: { type: Boolean, default: true },
    unavailableSince: { type: Date, default: null },
    syncedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
);

// The public archive: visible, newest first.
instagramMediaSchema.index({ hidden: 1, available: 1, provider: 1, timestamp: -1, _id: -1 });
instagramMediaSchema.index({ 'classification.primaryCategory': 1, timestamp: -1 });
instagramMediaSchema.index({ 'classification.language': 1 });
instagramMediaSchema.index({ 'classification.themes': 1 });
instagramMediaSchema.index({ 'classification.needsReview': 1 });
instagramMediaSchema.index(
  { caption: 'text', displayTitle: 'text' },
  { name: 'instagram_text', default_language: 'none', language_override: 'textSearchLanguage' },
);

export type InstagramMediaAttrs = InferSchemaType<typeof instagramMediaSchema>;
export type InstagramMediaDoc = HydratedDocument<InstagramMediaAttrs>;

export const InstagramMedia: Model<InstagramMediaAttrs> = model<InstagramMediaAttrs>(
  'InstagramMedia',
  instagramMediaSchema,
);
