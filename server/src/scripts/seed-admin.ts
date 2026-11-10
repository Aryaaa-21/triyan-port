/**
 * Creates the single administrator. There is deliberately no public signup route.
 *
 *   npm run seed:admin -w @triyan/server -- --email you@example.com
 *
 * The password is read from ADMIN_SEED_PASSWORD, never from a command-line argument,
 * because arguments are visible in the process list and shell history.
 */
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { createAdmin } from '../services/auth.service.js';
import { hashPassword } from '../services/password.service.js';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const main = async (): Promise<void> => {
  const email = (arg('email') ?? process.env.ADMIN_SEED_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? '';

  if (!email || !password) {
    console.error(
      'Usage: ADMIN_SEED_PASSWORD=... npm run seed:admin -w @triyan/server -- --email you@example.com',
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error(
      'Refusing to create an administrator with a password shorter than 12 characters.',
    );
    process.exit(1);
  }

  if (!env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await connectDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.passwordHash = await hashPassword(password);
    existing.failedLoginCount = 0;
    existing.lockedUntil = null;
    await existing.save();
    console.log(`Password reset for existing administrator ${email}`);
  } else {
    await createAdmin(email, password, arg('name') ?? '');
    console.log(`Administrator created: ${email}`);
  }

  await disconnectDatabase();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
