import type { RequestHandler } from 'express';
import { z } from 'zod';
import { objectIdSchema } from '@triyan/shared';
import { ContactMessage, WaitlistSubscriber } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { noContent, noStore, ok } from '../utils/respond.js';

/** The owner's inbox: contact messages, newest first, unread on top. */
export const listMessages: RequestHandler = async (_req, res) => {
  const [messages, unread] = await Promise.all([
    ContactMessage.find().sort({ read: 1, createdAt: -1 }).limit(200).lean(),
    ContactMessage.countDocuments({ read: false }),
  ]);
  noStore(res);
  ok(res, messages, { unread, total: messages.length });
};

export const markMessage: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  const body = z.object({ read: z.boolean() }).safeParse(req.body);
  if (!id.success) return next(HttpError.notFound());
  if (!body.success) return next(body.error);
  const message = await ContactMessage.findByIdAndUpdate(
    id.data,
    { $set: { read: body.data.read } },
    { returnDocument: 'after' },
  ).lean();
  if (!message) return next(HttpError.notFound());
  noStore(res);
  ok(res, message);
};

export const deleteMessage: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());
  const removed = await ContactMessage.findByIdAndDelete(id.data);
  if (!removed) return next(HttpError.notFound());
  noStore(res);
  noContent(res);
};

export const listWaitlist: RequestHandler = async (_req, res) => {
  const [subscribers, total] = await Promise.all([
    WaitlistSubscriber.find().sort({ createdAt: -1 }).limit(500).lean(),
    WaitlistSubscriber.countDocuments(),
  ]);
  noStore(res);
  ok(res, subscribers, { total });
};

/** CSV export, for whichever mailing tool is chosen at launch. */
export const exportWaitlist: RequestHandler = async (_req, res) => {
  const subscribers = await WaitlistSubscriber.find().sort({ createdAt: 1 }).lean();
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = subscribers.map((s) =>
    [s.email, s.name ?? '', new Date(s.consentAt).toISOString()].map(escape).join(','),
  );
  noStore(res);
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.setHeader('content-disposition', 'attachment; filename="abyss-waitlist.csv"');
  res.send(['email,name,consented_at', ...rows].join('\n'));
};
