import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Someone who asked to hear when ABYSS launches. The address is stored once
 * (unique), with the moment consent was given, and used for nothing else.
 */
const waitlistSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    name: { type: String, trim: true, maxlength: 80, default: '' },
    consentAt: { type: Date, required: true },
    source: { type: String, default: 'abyss', maxlength: 40 },
  },
  { timestamps: true, versionKey: false },
);

export type WaitlistSubscriberAttrs = InferSchemaType<typeof waitlistSubscriberSchema>;

export const WaitlistSubscriber: Model<WaitlistSubscriberAttrs> = model<WaitlistSubscriberAttrs>(
  'WaitlistSubscriber',
  waitlistSubscriberSchema,
);
