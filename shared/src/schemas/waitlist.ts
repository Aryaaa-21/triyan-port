import { z } from 'zod';
import { categoryKeySchema, emailSchema } from './common.js';

export const waitlistSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(80).optional(),
  consent: z.literal(true, { error: 'Consent is required to join the waitlist' }),
  /** Honeypot: must stay empty. Populated only by bots. */
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(80),
  email: emailSchema,
  message: z.string().trim().min(10, 'Say a little more').max(4000),
  /** The campaign tags the sender arrived with, if any (see client lib/utm). */
  source: z.string().trim().max(200).optional(),
  website: z.string().max(0).optional(),
});

/** Signing up to be emailed when a new writing is published. */
export const subscribeSchema = z.object({
  email: emailSchema,
  consent: z.literal(true, { error: 'Tick the box to say yes' }),
  /** The shelves the reader cares about. Empty or absent means all of them. */
  interests: z.array(categoryKeySchema).max(8).optional(),
  website: z.string().max(0).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
