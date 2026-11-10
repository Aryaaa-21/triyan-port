import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * About — a singleton holding the author page's editable content.
 *
 * Deliberately absent: date of birth, age, location, follower counts, awards. The
 * owner supplied "writing since around age 10 / 2016"; stating both publicly would
 * disclose a birth year, which is personal information this system will not derive
 * or store. Only `writingSince` is kept, as free text the owner controls.
 */
const aboutSchema = new Schema(
  {
    key: { type: String, default: 'about', unique: true, immutable: true },

    displayName: { type: String, trim: true, maxlength: 80, default: 'Triyan' },
    literaryIdentity: { type: String, trim: true, maxlength: 80, default: 'Triyan Writes' },

    /** Free text, exactly as the owner wants it phrased. Never computed. */
    writingSince: { type: String, trim: true, maxlength: 80, default: '' },

    /** Long-form body. Preserves paragraph breaks, so it is not trimmed. */
    body: { type: String, maxlength: 20_000, default: '' },

    /** A short literary statement used on the homepage. */
    statement: { type: String, maxlength: 600, default: '' },

    portraitUrl: { type: String, trim: true, default: '' },

    links: {
      literaryInstagram: { type: String, trim: true, default: '' },
      personalInstagram: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true, versionKey: false },
);

export type AboutAttrs = InferSchemaType<typeof aboutSchema>;
export const About: Model<AboutAttrs> = model<AboutAttrs>('About', aboutSchema);
