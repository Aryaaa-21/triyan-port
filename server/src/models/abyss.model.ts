import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Abyss — a singleton for the creative identity's own page.
 *
 * Separate from SiteSettings because it is a content surface the owner edits, not
 * configuration. Deliberately has no product, price, inventory or order field:
 * commerce does not exist, and a schema that implies it would invite the page to
 * pretend otherwise. Phase 4 adds the waitlist.
 */
const abyssSchema = new Schema(
  {
    key: { type: String, default: 'abyss', unique: true, immutable: true },

    name: { type: String, trim: true, maxlength: 40, default: 'ABYSS' },
    tagline: { type: String, trim: true, maxlength: 200, default: '' },
    philosophy: { type: String, maxlength: 2000, default: '' },

    /** What the brand currently is. Free text, owner-controlled. */
    direction: { type: String, maxlength: 2000, default: '' },

    /** Shown instead of any commerce affordance. */
    comingSoonNote: { type: String, maxlength: 400, default: '' },

    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type AbyssAttrs = InferSchemaType<typeof abyssSchema>;
export const Abyss: Model<AbyssAttrs> = model<AbyssAttrs>('Abyss', abyssSchema);
