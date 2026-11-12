import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Sending email, through whichever provider is configured (Resend or Brevo). Both are
 * plain HTTPS calls, so no library is needed. With EMAIL_PROVIDER=none nothing is sent
 * and `mailEnabled()` is false; callers decide what that means for them.
 */
export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export type Transport = (mail: Mail) => Promise<void>;

/** `Triyan Writes <hello@example.com>` → { name, email }. A bare address has no name. */
export const parseSender = (from: string): { name: string; email: string } => {
  const match = from.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  return match
    ? { name: (match[1] ?? '').replace(/^"|"$/g, ''), email: (match[2] ?? '').trim() }
    : { name: '', email: from.trim() };
};

const post = async (url: string, headers: Record<string, string>, body: unknown): Promise<void> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(`Email provider answered ${response.status}: ${detail}`);
  }
};

const resend: Transport = (mail) =>
  post(
    'https://api.resend.com/emails',
    { authorization: `Bearer ${env.RESEND_API_KEY ?? ''}` },
    {
      from: env.EMAIL_FROM,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(mail.headers ? { headers: mail.headers } : {}),
    },
  );

const brevo: Transport = (mail) =>
  post(
    'https://api.brevo.com/v3/smtp/email',
    { 'api-key': env.BREVO_API_KEY ?? '' },
    {
      sender: parseSender(env.EMAIL_FROM ?? ''),
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
      ...(mail.headers ? { headers: mail.headers } : {}),
    },
  );

const configured = (): Transport | null =>
  env.EMAIL_PROVIDER === 'resend' ? resend : env.EMAIL_PROVIDER === 'brevo' ? brevo : null;

/** Tests swap the transport for one that records instead of sending. */
let override: Transport | null | undefined;
export const setTransportForTests = (transport: Transport | null | undefined): void => {
  override = transport;
};

const transport = (): Transport | null => (override !== undefined ? override : configured());

export const mailEnabled = (): boolean => transport() !== null;

export const sendMail = async (mail: Mail): Promise<void> => {
  const send = transport();
  if (!send) throw new Error('No email provider is configured');
  await send(mail);
};

/**
 * Sends many, a few at a time, and never throws: one bad address must not stop the
 * rest. Returns how many went out and how many did not.
 */
export const sendMany = async (
  mails: Mail[],
  concurrency = 6,
): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;
  let next = 0;
  const worker = async () => {
    while (next < mails.length) {
      const mail = mails[next++];
      if (!mail) continue;
      try {
        await sendMail(mail);
        sent++;
      } catch (error) {
        failed++;
        logger.warn({ event: 'mail.failed', err: error }, 'An email could not be sent');
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, mails.length) }, worker));
  return { sent, failed };
};
