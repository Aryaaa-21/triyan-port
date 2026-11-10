import type { Types } from 'mongoose';
import { User } from '../models/index.js';
import { hashPassword, verifyPassword, wasteTimeLikeAVerification } from './password.service.js';
import { issueSession, revokeSession, type IssuedSession } from './session.service.js';

/**
 * Per-account lockout, which complements the per-IP rate limiter on the route.
 * The limiter stops one host hammering the form; this stops a distributed attempt
 * against a single known address.
 */
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export type LoginResult =
  | { ok: true; user: AuthenticatedUser; session: IssuedSession }
  | { ok: false; reason: 'INVALID_CREDENTIALS' | 'LOCKED'; retryAfterMs?: number };

const toPublicUser = (doc: {
  _id: Types.ObjectId;
  email: string;
  name?: string | null;
  role?: string | null;
}): AuthenticatedUser => ({
  id: doc._id.toString(),
  email: doc.email,
  name: doc.name ?? '',
  role: doc.role ?? 'ADMIN',
});

export const login = async (
  email: string,
  password: string,
  context: { userAgent?: string } = {},
): Promise<LoginResult> => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    // Spend the same time as a real verification so the response cannot be used to
    // discover which addresses exist.
    await wasteTimeLikeAVerification(password);
    return { ok: false, reason: 'INVALID_CREDENTIALS' };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return {
      ok: false,
      reason: 'LOCKED',
      retryAfterMs: user.lockedUntil.getTime() - Date.now(),
    };
  }

  const correct = await verifyPassword(user.passwordHash, password);

  if (!correct) {
    const failed = (user.failedLoginCount ?? 0) + 1;
    user.failedLoginCount = failed;
    if (failed >= MAX_FAILED_LOGINS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
      user.failedLoginCount = 0;
    }
    await user.save();
    return { ok: false, reason: 'INVALID_CREDENTIALS' };
  }

  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const session = await issueSession(user._id, context);
  return { ok: true, user: toPublicUser(user), session };
};

export const logout = async (token: string): Promise<void> => {
  await revokeSession(token);
};

export const findAuthenticatedUser = async (
  userId: Types.ObjectId,
): Promise<AuthenticatedUser | null> => {
  const user = await User.findById(userId);
  return user ? toPublicUser(user) : null;
};

/** Used by the seed script only. There is no public signup route. */
export const createAdmin = async (
  email: string,
  password: string,
  name = '',
): Promise<AuthenticatedUser> => {
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, name });
  return toPublicUser(user);
};
