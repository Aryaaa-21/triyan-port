import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const SUBSCRIBER_STATUSES = ['PENDING', 'ACTIVE', 'UNSUBSCRIBED'] as const;

/**
 * Someone who asked to be emailed when a new writing is published.
 *
 * PENDING until they click the link in the confirmation email (so nobody can sign up
 * an address that is not theirs), ACTIVE after, UNSUBSCRIBED once they leave. The
 * token is the only key to both of those links; it is random and never shown in lists.
 */
const subscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    status: { type: String, enum: SUBSCRIBER_STATUSES, default: 'PENDING', required: true },
    token: { type: String, required: true, unique: true, select: false },
    consentAt: { type: Date, required: true },
    confirmedAt: { type: Date, default: null },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

subscriberSchema.index({ status: 1, createdAt: -1 });

export type SubscriberAttrs = InferSchemaType<typeof subscriberSchema>;
export const Subscriber: Model<SubscriberAttrs> = model<SubscriberAttrs>(
  'Subscriber',
  subscriberSchema,
);
