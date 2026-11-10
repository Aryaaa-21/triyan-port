import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

/**
 * RefreshToken — one row per issued refresh token, enabling rotation with reuse
 * detection.
 *
 * Only a SHA-256 hash of the token is stored, so a database leak does not hand an
 * attacker usable sessions. When a token is used it is marked `usedAt` and replaced;
 * if a token that was already used is presented again, that is evidence of theft and
 * the whole family is revoked.
 *
 * `expiresAt` carries a TTL index, so MongoDB removes dead rows without a cron job.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    /** sha256(token). The raw token exists only in the client's cookie. */
    tokenHash: { type: String, required: true, unique: true },

    /** Groups every token descended from one login, so theft revokes the lineage. */
    family: { type: String, required: true, index: true },

    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },

    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true, versionKey: false },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenAttrs = InferSchemaType<typeof refreshTokenSchema>;

export const RefreshToken: Model<RefreshTokenAttrs> = model<RefreshTokenAttrs>(
  'RefreshToken',
  refreshTokenSchema,
);
