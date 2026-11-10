import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * SiteSettings — a singleton for values the owner must change without a deploy.
 *
 * Kept deliberately small. Anything that belongs to a page lives on that page's
 * document; this holds only cross-cutting configuration.
 */
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: 'settings', unique: true, immutable: true },

    siteTitle: { type: String, trim: true, maxlength: 80, default: 'Triyan' },
    tagline: { type: String, trim: true, maxlength: 200, default: '' },
    defaultSeoDescription: { type: String, maxlength: 180, default: '' },
    defaultOgImageUrl: { type: String, trim: true, default: '' },

    /** Lets the owner close the contact form without a deploy if it is abused. */
    contactFormEnabled: { type: Boolean, default: true },

    /** Suppresses the cinematic intro globally; useful during an incident. */
    introEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type SiteSettingsAttrs = InferSchemaType<typeof siteSettingsSchema>;
export const SiteSettings: Model<SiteSettingsAttrs> = model<SiteSettingsAttrs>(
  'SiteSettings',
  siteSettingsSchema,
);
