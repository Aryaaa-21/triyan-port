import { Schema, model, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';

/**
 * User — the single administrator.
 *
 * There is no public signup route and no role hierarchy yet; `role` exists so that
 * adding an editor later does not require a migration. The password hash is excluded
 * from queries by default (`select: false`) so it cannot be leaked by a careless
 * `findOne()` that is later serialised into a response.
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    name: { type: String, trim: true, maxlength: 80 },

    /** argon2id hash. Never a plaintext password, never returned by default. */
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: ['ADMIN'], default: 'ADMIN' },

    lastLoginAt: { type: Date, default: null },

    /** Failed-login throttling state, so lockout survives a process restart. */
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// `unique: true` on the field already declares this index; declaring it twice makes
// Mongoose drop the options on the duplicate.

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const User: Model<UserAttrs> = model<UserAttrs>('User', userSchema);
