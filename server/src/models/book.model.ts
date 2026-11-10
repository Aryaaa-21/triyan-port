import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Book — a singleton for *Leaving and Living*.
 *
 * Every factual field defaults to empty rather than to a plausible-looking value.
 * Publisher, ISBN, price, publication date and formats are unknown at the time of
 * writing, and the product rule is explicit: unknown information is represented as
 * missing, never invented (spec §5 / §28). The frontend renders an empty field as
 * absent, not as "TBA".
 */
const reviewSchema = new Schema(
  {
    quote: { type: String, required: true, maxlength: 2000 },
    attribution: { type: String, trim: true, maxlength: 120 },
    source: { type: String, trim: true, maxlength: 200 },
    publishedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: true },
);

const bookSchema = new Schema(
  {
    /** Enforces the singleton: exactly one document may exist. */
    key: { type: String, default: 'book', unique: true, immutable: true },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: 'Leaving and Living',
    },
    subtitle: { type: String, trim: true, maxlength: 200, default: '' },

    /** Supplied by the owner. */
    description: { type: String, maxlength: 4000, default: '' },
    audience: { type: String, maxlength: 1000, default: '' },
    salesLine: { type: String, maxlength: 400, default: '' },

    coverImageUrl: { type: String, trim: true, default: '' },
    purchaseUrl: { type: String, trim: true, default: '' },

    /** Unconfirmed metadata. Empty until the owner supplies it — never guessed. */
    publisher: { type: String, trim: true, default: '' },
    isbn: { type: String, trim: true, default: '' },
    price: { type: String, trim: true, default: '' },
    publicationDate: { type: Date, default: null },
    formats: { type: [String], default: [] },

    /** Only real, supplied reviews. Never generated. */
    reviews: { type: [reviewSchema], default: [] },

    /** Writings selected as excerpts, by slug, so the archive stays canonical. */
    excerptSlugs: { type: [String], default: [] },

    published: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export type BookAttrs = InferSchemaType<typeof bookSchema>;
export const Book: Model<BookAttrs> = model<BookAttrs>('Book', bookSchema);
