import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Types } from 'mongoose';
import { Session } from '../models/index.js';

/**
 * Opaque, database-backed sessions. See the note on the Session model for why this
 * replaced the JWT design.
 */

/** Absolute lifetime: a session cannot outlive this however active it is. */
export const SESSION_ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000;
/** Idle lifetime: an unused session dies sooner than its absolute expiry. */
export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE = 'triyan_session';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/** 256 bits of entropy, url-safe. */
const newToken = (): string => randomBytes(32).toString('base64url');

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

export const issueSession = async (
  userId: Types.ObjectId,
  options: { family?: string; userAgent?: string } = {},
): Promise<IssuedSession> => {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MS);

  await Session.create({
    user: userId,
    tokenHash: sha256(token),
    family: options.family ?? randomBytes(16).toString('hex'),
    expiresAt,
    lastUsedAt: new Date(),
    ...(options.userAgent ? { userAgent: options.userAgent.slice(0, 300) } : {}),
  });

  return { token, expiresAt };
};

export type SessionLookup =
  | { status: 'valid'; userId: Types.ObjectId; sessionId: Types.ObjectId }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'reused' };

/**
 * Resolves a presented token.
 *
 * A token that exists but has been revoked or rotated away is treated as theft: the
 * entire family is revoked, which logs out the attacker *and* the legitimate holder.
 * That is the correct trade — a forced re-login beats a silent intruder.
 */
export const resolveSession = async (token: string): Promise<SessionLookup> => {
  if (!token) return { status: 'invalid' };

  const session = await Session.findOne({ tokenHash: sha256(token) });
  if (!session) return { status: 'invalid' };

  if (session.revokedAt || session.usedAt) {
    await Session.updateMany(
      { family: session.family, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return { status: 'reused' };
  }

  const now = Date.now();
  const idleDeadline = (session.lastUsedAt?.getTime() ?? now) + SESSION_IDLE_MS;
  if (session.expiresAt.getTime() <= now || idleDeadline <= now) {
    await Session.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    return { status: 'expired' };
  }

  session.lastUsedAt = new Date();
  await session.save();

  return { status: 'valid', userId: session.user, sessionId: session._id };
};

export const revokeSession = async (token: string): Promise<void> => {
  await Session.updateOne({ tokenHash: sha256(token) }, { $set: { revokedAt: new Date() } });
};

export const revokeAllSessionsFor = async (userId: Types.ObjectId): Promise<void> => {
  await Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

/** Constant-time comparison, for CSRF tokens and similar. */
export const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

export const hashToken = sha256;
