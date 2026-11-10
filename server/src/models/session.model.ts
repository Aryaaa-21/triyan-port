import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

/**
 * Session — one row per issued session token.
 *
 * **Deviation from the original architecture, deliberately.** That design specified a
 * signed JWT access token plus a rotating refresh token. For a single-administrator
 * CMS an opaque, database-backed token is simpler and strictly safer: it is revocable
 * the instant it is withdrawn, it cannot be forged if a signing secret leaks, and
 * there is no secret to rotate. The cost is one indexed lookup per authenticated
 * request, which is irrelevant at this scale.
 *
 * Only a SHA-256 hash of the token is stored, so a database leak hands an attacker
 * nothing usable. Tokens belong to a `family`: presenting a token that has already
 * been rotated away or revoked is evidence of theft, and revokes the whole lineage.
 *
 * `expiresAt` carries a TTL index, so MongoDB removes dead rows without a cron job.
 */
const sessionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    /** sha256(token). The raw token exists only in the client's cookie. */
    tokenHash: { type: String, required: true, unique: true },

    /** Groups every token descended from one login, so theft revokes the lineage. */
    family: { type: String, required: true, index: true },

    usedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },

    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionAttrs = InferSchemaType<typeof sessionSchema>;

export const Session: Model<SessionAttrs> = model<SessionAttrs>('Session', sessionSchema);
