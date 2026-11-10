import { hash, verify } from '@node-rs/argon2';

/**
 * argon2id with OWASP's recommended second-choice parameters (19 MiB, t=2, p=1).
 * The library ships prebuilt binaries, so there is no node-gyp build step.
 */
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

/**
 * A real hash of a throwaway value, computed once at startup.
 *
 * When a login names an address that does not exist, we verify against this instead of
 * returning early. Without it, "no such user" answers measurably faster than "wrong
 * password", which turns the login form into an account-enumeration oracle.
 */
let decoyHash: Promise<string> | null = null;

export const hashPassword = (plaintext: string): Promise<string> => hash(plaintext, OPTIONS);

export const verifyPassword = async (storedHash: string, plaintext: string): Promise<boolean> => {
  try {
    return await verify(storedHash, plaintext);
  } catch {
    // A malformed or truncated hash must read as "wrong password", never as an error.
    return false;
  }
};

/** Burns roughly the same time as a real verification. */
export const wasteTimeLikeAVerification = async (plaintext: string): Promise<false> => {
  decoyHash ??= hash('decoy-value-never-a-real-password', OPTIONS);
  await verifyPassword(await decoyHash, plaintext);
  return false;
};
