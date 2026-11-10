import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.email('That does not look like an email address').trim().toLowerCase().max(254),
  name: z.string().trim().max(80).optional(),
  consent: z.literal(true, { error: 'Consent is required to join the waitlist' }),
  /** Honeypot: must stay empty. Populated only by bots. */
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(80),
  email: z.email().trim().toLowerCase().max(254),
  message: z.string().trim().min(10, 'Say a little more').max(4000),
  website: z.string().max(0).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
