import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { Subscriber, Writing } from '../models/index.js';
import { mailEnabled, sendMail, sendMany, type Mail } from './mailer.js';

/**
 * The mailing list for new writings: joining, confirming, leaving, and the one email
 * sent when the owner chooses to announce a published piece.
 */

const site = (): string => env.PUBLIC_SITE_URL.replace(/\/+$/, '');
const newToken = (): string => randomBytes(24).toString('base64url');

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const confirmUrl = (token: string): string =>
  `${site()}/api/v1/newsletter/confirm?token=${encodeURIComponent(token)}`;

/** Opens a page with a button; the link itself changes nothing, so a mail scanner cannot unsubscribe anyone. */
export const unsubscribeUrl = (token: string): string =>
  `${site()}/subscription?leave=${encodeURIComponent(token)}`;

/** The address mail apps call for their own one-click "Unsubscribe" button (RFC 8058). */
const oneClickUrl = (token: string): string =>
  `${site()}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;

/* ------------------------------------------------------------------ templates */

const INK = '#111111';
const SOFT = '#666666';
const RULE = '#dddddd';

const shell = (body: string, footer: string): string =>
  `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:Georgia,'Times New Roman',serif;color:${INK};">
<p style="margin:0 0 32px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${SOFT};">Triyan Writes</p>
${body}
<p style="margin:40px 0 0;padding-top:20px;border-top:1px solid ${RULE};font-family:'Courier New',monospace;font-size:11px;line-height:1.7;color:${SOFT};">${footer}</p>
</div></body></html>`;

const button = (href: string, label: string): string =>
  `<p style="margin:32px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:${INK};color:#ffffff;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(label)}</a></p>`;

export const confirmationMail = (to: string, token: string): Mail => {
  const url = confirmUrl(token);
  return {
    to,
    subject: 'Confirm your address — Triyan Writes',
    text: [
      'You asked to be emailed when Triyan publishes a new writing.',
      '',
      'Confirm your address by opening this link:',
      url,
      '',
      'If this was not you, ignore this email and nothing more will be sent.',
    ].join('\n'),
    html: shell(
      `<p style="margin:0;font-size:26px;line-height:1.3;">One step left.</p>
<p style="margin:16px 0 0;font-size:17px;line-height:1.7;color:${SOFT};">You asked to be emailed when Triyan publishes a new writing. Confirm that this address is yours.</p>
${button(url, 'Confirm my address')}`,
      'If this was not you, ignore this email and nothing more will be sent.',
    ),
  };
};

/** The opening of a piece: its first lines, never the whole of it. */
export const opening = (content: string, lines = 6): { text: string; cut: boolean } => {
  const all = content.replace(/\r/g, '').trim().split('\n');
  const kept = all.slice(0, lines);
  while (kept.length > 0 && kept[kept.length - 1]?.trim() === '') kept.pop();
  return { text: kept.join('\n'), cut: all.length > kept.length };
};

export const announcementMail = (
  to: string,
  token: string,
  writing: { title: string; slug: string; content: string },
): Mail => {
  const url = `${site()}/writings/${writing.slug}?utm_source=email&utm_medium=newsletter`;
  const leave = unsubscribeUrl(token);
  const { text, cut } = opening(writing.content);
  const lines = `${text}${cut ? '\n…' : ''}`;
  return {
    to,
    subject: `${writing.title} — a new writing by Triyan`,
    text: [
      writing.title,
      '',
      lines,
      '',
      '~Triyan',
      '',
      `Read the full piece: ${url}`,
      '',
      `You are receiving this because you asked to be told about new writings. Unsubscribe: ${leave}`,
    ].join('\n'),
    html: shell(
      `<p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${SOFT};">A new writing</p>
<p style="margin:14px 0 0;font-size:28px;line-height:1.25;">${escapeHtml(writing.title)}</p>
<p style="margin:28px 0 0;font-size:18px;line-height:1.9;white-space:pre-line;">${escapeHtml(lines)}</p>
<p style="margin:24px 0 0;font-size:20px;font-style:italic;">~Triyan</p>
${button(url, 'Read the full piece')}`,
      `You are receiving this because you asked to be told about new writings on Triyan Writes. <a href="${escapeHtml(leave)}" style="color:${SOFT};">Unsubscribe</a>.`,
    ),
    headers: {
      'List-Unsubscribe': `<${oneClickUrl(token)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
};

/* --------------------------------------------------------------------- joining */

export type SubscribeOutcome = 'CONFIRMATION_SENT' | 'SUBSCRIBED';

/**
 * Adds an address. With email configured the address stays PENDING until its owner
 * confirms; without it (nothing can be sent yet) the ticked consent box is taken as
 * the yes, so sign-ups are not lost before the provider is connected.
 *
 * The answer never reveals whether the address was already on the list.
 */
export const subscribe = async (email: string): Promise<SubscribeOutcome> => {
  const canMail = mailEnabled();
  const existing = await Subscriber.findOne({ email }).select('+token');

  if (existing?.status === 'ACTIVE') return canMail ? 'CONFIRMATION_SENT' : 'SUBSCRIBED';

  const now = new Date();
  const token = existing?.token ?? newToken();
  await Subscriber.updateOne(
    { email },
    {
      $set: {
        status: canMail ? 'PENDING' : 'ACTIVE',
        consentAt: now,
        confirmedAt: canMail ? null : now,
        unsubscribedAt: null,
      },
      $setOnInsert: { email, token },
    },
    { upsert: true },
  );

  if (!canMail) return 'SUBSCRIBED';
  await sendMail(confirmationMail(email, token));
  return 'CONFIRMATION_SENT';
};

export const confirm = async (token: string): Promise<boolean> => {
  if (!token) return false;
  const result = await Subscriber.updateOne(
    { token, status: { $ne: 'UNSUBSCRIBED' } },
    { $set: { status: 'ACTIVE', confirmedAt: new Date() } },
  );
  return result.matchedCount > 0;
};

export const unsubscribe = async (token: string): Promise<boolean> => {
  if (!token) return false;
  const result = await Subscriber.updateOne(
    { token },
    { $set: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() } },
  );
  return result.matchedCount > 0;
};

/* ------------------------------------------------------------------ announcing */

export type AnnounceOutcome =
  | { ok: true; total: number; sent: number; failed: number }
  | { ok: false; reason: 'NO_MAIL' | 'NOT_FOUND' | 'NOT_PUBLISHED' | 'ALREADY_SENT' };

/**
 * Emails one published writing to every confirmed subscriber — once. The piece is
 * marked as announced *before* sending, so two clicks (or two tabs) cannot send it
 * twice; if not a single email goes out, the mark is taken back so it can be retried.
 */
export const announceWriting = async (id: string): Promise<AnnounceOutcome> => {
  if (!mailEnabled()) return { ok: false, reason: 'NO_MAIL' };

  const current = await Writing.findById(id).select('status notifiedAt bookExclusive').lean();
  if (!current) return { ok: false, reason: 'NOT_FOUND' };
  if (current.status !== 'PUBLISHED' || current.bookExclusive)
    return { ok: false, reason: 'NOT_PUBLISHED' };
  if (current.notifiedAt) return { ok: false, reason: 'ALREADY_SENT' };

  const claimed = await Writing.findOneAndUpdate(
    { _id: id, status: 'PUBLISHED', notifiedAt: null },
    { $set: { notifiedAt: new Date() } },
    { returnDocument: 'after', timestamps: false },
  ).lean();
  if (!claimed) return { ok: false, reason: 'ALREADY_SENT' };

  const subscribers = await Subscriber.find({ status: 'ACTIVE' }).select('+token email').lean();
  const { sent, failed } = await sendMany(
    subscribers.map((s) => announcementMail(s.email, s.token, claimed)),
  );

  if (subscribers.length > 0 && sent === 0) {
    await Writing.updateOne({ _id: id }, { $set: { notifiedAt: null } }, { timestamps: false });
  }
  return { ok: true, total: subscribers.length, sent, failed };
};

export const subscriberSummary = async () => {
  const [active, pending, unsubscribed] = await Promise.all([
    Subscriber.countDocuments({ status: 'ACTIVE' }),
    Subscriber.countDocuments({ status: 'PENDING' }),
    Subscriber.countDocuments({ status: 'UNSUBSCRIBED' }),
  ]);
  return { active, pending, unsubscribed, mailEnabled: mailEnabled() };
};
