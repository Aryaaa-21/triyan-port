import { describe, expect, it } from 'vitest';
import { changePasswordSchema, loginSchema } from './auth.js';

describe('loginSchema', () => {
  it('accepts a valid credential pair', () => {
    expect(loginSchema.safeParse({ email: 'triyan@example.com', password: 'secret' }).success).toBe(
      true,
    );
  });

  it('lowercases the address so login is not case-sensitive', () => {
    expect(loginSchema.parse({ email: 'Triyan@Example.COM', password: 'x' }).email).toBe(
      'triyan@example.com',
    );
  });

  /**
   * Pasting an address from a password manager or an email client very often carries
   * surrounding whitespace. Rejecting that is a login failure the user cannot diagnose.
   */
  it('tolerates surrounding whitespace on a pasted address', () => {
    const result = loginSchema.safeParse({ email: '  triyan@example.com  ', password: 'x' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('triyan@example.com');
  });

  it.each(['not-an-email', 'missing@tld', '@example.com', 'two@@example.com', ''])(
    'rejects %o',
    (email) => {
      expect(loginSchema.safeParse({ email, password: 'x' }).success).toBe(false);
    },
  );

  it('requires a password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co' }).success).toBe(false);
  });

  it('bounds the address and password length', () => {
    expect(loginSchema.safeParse({ email: `${'a'.repeat(250)}@b.co`, password: 'x' }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(201) }).success).toBe(
      false,
    );
  });
});

describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'old-password-1A', newPassword: 'NewPassword99' };

  it('accepts a strong new password', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['Short1', 'shorter than 12'],
    ['alllowercase99', 'no uppercase'],
    ['ALLUPPERCASE99', 'no lowercase'],
    ['NoDigitsAtAllHere', 'no digit'],
  ])('rejects %o (%s)', (newPassword) => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword }).success).toBe(false);
  });

  it('refuses to re-set the same password', () => {
    const same = 'SamePassword99';
    const result = changePasswordSchema.safeParse({ currentPassword: same, newPassword: same });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['newPassword']);
    }
  });

  it('requires the current password', () => {
    expect(changePasswordSchema.safeParse({ newPassword: 'NewPassword99' }).success).toBe(false);
  });
});
