import { describe, expect, it } from 'vitest';
import { contactSchema, waitlistSchema } from './waitlist.js';

const validWaitlist = { email: 'reader@example.com', consent: true as const };

describe('waitlistSchema', () => {
  it('accepts an email with consent', () => {
    expect(waitlistSchema.safeParse(validWaitlist).success).toBe(true);
  });

  it('normalises the address', () => {
    expect(waitlistSchema.parse({ ...validWaitlist, email: 'Reader@Example.COM' }).email).toBe(
      'reader@example.com',
    );
  });

  it('refuses to store an address without consent', () => {
    expect(waitlistSchema.safeParse({ email: 'reader@example.com' }).success).toBe(false);
    expect(waitlistSchema.safeParse({ email: 'reader@example.com', consent: false }).success).toBe(
      false,
    );
  });

  it('accepts an optional name, including a non-Latin one', () => {
    expect(waitlistSchema.parse({ ...validWaitlist, name: 'त्रियान' }).name).toBe('त्रियान');
  });

  it('rejects a submission where the honeypot was filled', () => {
    expect(waitlistSchema.safeParse({ ...validWaitlist, website: 'http://spam' }).success).toBe(
      false,
    );
  });

  it('accepts a submission where the honeypot is empty', () => {
    expect(waitlistSchema.safeParse({ ...validWaitlist, website: '' }).success).toBe(true);
  });

  it('rejects a malformed address', () => {
    expect(waitlistSchema.safeParse({ ...validWaitlist, email: 'nope' }).success).toBe(false);
  });
});

describe('contactSchema', () => {
  const valid = {
    name: 'A reader',
    email: 'reader@example.com',
    message: 'I read your work and wanted to say something about it.',
  };

  it('accepts a complete message', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a message of real length', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'hi' }).success).toBe(false);
  });

  it('requires a name', () => {
    expect(contactSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false);
  });

  it('bounds the message so the endpoint cannot be used as a dump', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'a'.repeat(4001) }).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    expect(contactSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false);
  });

  it('accepts a message in Hindi', () => {
    expect(
      contactSchema.safeParse({ ...valid, message: 'आपकी कविताएँ पढ़ीं, बहुत कुछ महसूस हुआ।' })
        .success,
    ).toBe(true);
  });
});
