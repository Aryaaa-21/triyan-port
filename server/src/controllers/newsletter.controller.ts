import type { RequestHandler } from 'express';
import { objectIdSchema, subscribeSchema } from '@triyan/shared';
import { Subscriber } from '../models/index.js';
import { logger } from '../config/logger.js';
import {
  announceWriting,
  confirm,
  subscribe,
  subscriberSummary,
  unsubscribe,
} from '../services/newsletter.service.js';
import { HttpError } from '../utils/httpError.js';
import { noContent, noStore, ok } from '../utils/respond.js';

/** A token arrives as text or not at all; anything else is treated as absent. */
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/* ---------------------------------------------------------------------- public */

export const postSubscribe: RequestHandler = async (req, res, next) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);
  noStore(res);
  // Honeypot filled: accept silently so a bot learns nothing.
  if (parsed.data.website) {
    ok(res, { outcome: 'CONFIRMATION_SENT' });
    return;
  }
  try {
    ok(res, { outcome: await subscribe(parsed.data.email) });
  } catch (error) {
    logger.error({ event: 'newsletter.subscribe_failed', err: error }, 'Confirmation not sent');
    next(HttpError.upstream('The confirmation email could not be sent. Try again in a moment.'));
  }
};

/** The link in the confirmation email. Lands on a page of the site that says what happened. */
export const getConfirm: RequestHandler = async (req, res) => {
  const done = await confirm(text(req.query.token));
  noStore(res);
  res.redirect(303, `/subscription?state=${done ? 'confirmed' : 'invalid'}`);
};

/** Leaving: the button on the site, and mail apps' own one-click unsubscribe. */
export const postUnsubscribe: RequestHandler = async (req, res) => {
  const body = (req.body ?? {}) as { token?: unknown };
  const token = text(req.query.token) || text(body.token);
  const done = await unsubscribe(token);
  noStore(res);
  ok(res, { unsubscribed: done });
};

/* ----------------------------------------------------------------------- admin */

export const listSubscribers: RequestHandler = async (_req, res) => {
  const [subscribers, summary] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).limit(1000).lean(),
    subscriberSummary(),
  ]);
  noStore(res);
  ok(res, subscribers, summary);
};

export const deleteSubscriber: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());
  const removed = await Subscriber.findByIdAndDelete(id.data);
  if (!removed) return next(HttpError.notFound());
  noStore(res);
  noContent(res);
};

/** CSV of confirmed subscribers, should the list ever move to another tool. */
export const exportSubscribers: RequestHandler = async (_req, res) => {
  const subscribers = await Subscriber.find({ status: 'ACTIVE' }).sort({ createdAt: 1 }).lean();
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = subscribers.map((s) =>
    [s.email, new Date(s.consentAt).toISOString()].map(escape).join(','),
  );
  noStore(res);
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.setHeader('content-disposition', 'attachment; filename="writing-subscribers.csv"');
  res.send(['email,consented_at', ...rows].join('\n'));
};

const REFUSALS = {
  NO_MAIL: () =>
    HttpError.conflict(
      'Email is not set up yet. Add EMAIL_PROVIDER, its API key and EMAIL_FROM on the server first.',
    ),
  NOT_FOUND: () => HttpError.notFound(),
  NOT_PUBLISHED: () => HttpError.conflict('Only a published writing can be emailed to subscribers'),
  ALREADY_SENT: () => HttpError.conflict('This writing has already been emailed to subscribers'),
} as const;

export const postAnnounce: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());
  const outcome = await announceWriting(id.data);
  if (!outcome.ok) return next(REFUSALS[outcome.reason]());
  logger.info(
    { event: 'newsletter.announced', sent: outcome.sent, failed: outcome.failed },
    'A writing was emailed to subscribers',
  );
  noStore(res);
  ok(res, { total: outcome.total, sent: outcome.sent, failed: outcome.failed });
};
