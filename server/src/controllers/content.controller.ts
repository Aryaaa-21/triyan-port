import type { RequestHandler } from 'express';
import { contactSchema, waitlistSchema } from '@triyan/shared';
import { getAbout, getAbyss, getBook, getSettings } from '../services/content.service.js';
import { noStore, ok, publicCache } from '../utils/respond.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';
import { ContactMessage, WaitlistSubscriber } from '../models/index.js';

export const getBookContent: RequestHandler = async (_req, res) => {
  publicCache(res, 300);
  ok(res, await getBook());
};

export const getAboutContent: RequestHandler = async (_req, res) => {
  publicCache(res, 300);
  ok(res, await getAbout());
};

export const getAbyssContent: RequestHandler = async (_req, res) => {
  publicCache(res, 300);
  ok(res, await getAbyss());
};

export const getSettingsContent: RequestHandler = async (_req, res) => {
  publicCache(res, 300);
  // Messages are delivered to the admin inbox (there is no email transport yet).
  ok(res, { ...(await getSettings()), contactDelivery: 'INBOX' as const });
};

/**
 * Contact submissions.
 *
 * There is no mail provider configured, and inventing one would mean pretending a
 * message was delivered when it was not. Until the owner supplies an address and a
 * transport, a submission is validated, rate-limited, logged for operational
 * visibility (without the message body) and acknowledged honestly by the UI.
 */
export const postContact: RequestHandler = async (req, res, next) => {
  const settings = await getSettings();
  if (!settings.contactFormEnabled) {
    next(HttpError.forbidden('The contact form is closed at the moment'));
    return;
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }

  // The honeypot was filled: accept silently so a bot learns nothing.
  if (parsed.data.website) {
    noStore(res);
    ok(res, { received: true });
    return;
  }

  // No mail transport exists, so the message goes to the admin inbox — a place the
  // owner actually reads — rather than being logged and lost.
  await ContactMessage.create({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    source: parsed.data.source ?? '',
  });
  logger.info({ event: 'contact.submission' }, 'Contact message stored in the inbox');

  noStore(res);
  ok(res, { received: true, delivery: 'INBOX' });
};

/* ------------------------------------------------------------- waitlist */

export const postWaitlist: RequestHandler = async (req, res, next) => {
  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  noStore(res);
  // Honeypot filled: accept silently so a bot learns nothing.
  if (parsed.data.website) {
    ok(res, { joined: true });
    return;
  }
  // Joining twice is not an error, and must not reveal whether an address is listed.
  await WaitlistSubscriber.updateOne(
    { email: parsed.data.email },
    {
      $setOnInsert: {
        email: parsed.data.email,
        name: parsed.data.name ?? '',
        consentAt: new Date(),
        source: 'abyss',
      },
    },
    { upsert: true },
  );
  ok(res, { joined: true });
};
