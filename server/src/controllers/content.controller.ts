import type { RequestHandler } from 'express';
import { contactSchema } from '@triyan/shared';
import { getAbout, getAbyss, getBook, getSettings } from '../services/content.service.js';
import { noStore, ok, publicCache } from '../utils/respond.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';

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
  // No mail transport is configured, so the site must not imply messages are delivered.
  ok(res, { ...(await getSettings()), contactDelivery: 'NONE' as const });
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

  logger.info(
    { event: 'contact.submission', hasName: Boolean(parsed.data.name) },
    'Contact form submitted',
  );

  noStore(res);
  ok(res, { received: true, delivery: 'PENDING_TRANSPORT' });
};
