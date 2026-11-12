import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A message sent through the contact form, kept in the admin inbox until an email
 * transport exists. Read by the owner only; never served publicly.
 */
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, required: true, maxlength: 4000 },
    /** Campaign tags the sender arrived with, e.g. "instagram / book". */
    source: { type: String, trim: true, maxlength: 200, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ read: 1, createdAt: -1 });

export type ContactMessageAttrs = InferSchemaType<typeof contactMessageSchema>;

export const ContactMessage: Model<ContactMessageAttrs> = model<ContactMessageAttrs>(
  'ContactMessage',
  contactMessageSchema,
);
