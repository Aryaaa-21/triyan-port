'use client';

import { useState } from 'react';
import { contactSchema } from '@triyan/shared';
import { TextAreaField, TextField } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

type State = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * The contact form.
 *
 * Validated with the same zod schema the API uses, so the two cannot disagree about
 * what a valid message is. The honeypot field is visually hidden but reachable by a
 * bot; a real reader never sees or tabs into it.
 */
export function ContactForm({ deliverable = true }: { deliverable?: boolean }) {
  const [state, setState] = useState<State>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliverable) return;
    setFieldErrors({});
    setFormError('');

    const form = new FormData(event.currentTarget);
    const candidate = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      message: String(form.get('message') ?? ''),
      website: String(form.get('website') ?? ''),
    };

    const parsed = contactSchema.safeParse(candidate);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setState('sending');
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const body = (await response
        .clone()
        .json()
        .catch(() => ({}))) as {
        data?: { delivery?: string };
      };
      // The API accepted the message but has no way to deliver it: say so, plainly.
      if (response.ok && body.data?.delivery === 'PENDING_TRANSPORT') {
        setFormError('The inbox is not connected yet, so this message could not be delivered.');
        setState('failed');
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setFormError(body.error?.message ?? 'The message could not be sent.');
        setState('failed');
        return;
      }

      setState('sent');
    } catch {
      setFormError('The message could not be sent. Check your connection and try again.');
      setState('failed');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="border-l border-fg py-2 pl-6">
        <p className="font-display text-3xl font-light text-fg">Your message was sent.</p>
        <p className="mt-3 font-reading text-lg text-fg-muted">A reply may take a while.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-10">
      {!deliverable && (
        <p
          role="note"
          className="border-l border-border-strong py-1 pl-5 font-reading text-base leading-prose text-fg-muted"
        >
          The inbox is not connected yet, so the form is closed. Instagram is the surest way to
          reach Triyan for now.
        </p>
      )}
      <fieldset disabled={!deliverable} className="m-0 flex flex-col gap-10 border-0 p-0">
        <TextField
          label="Name"
          name="name"
          required
          autoComplete="name"
          {...(fieldErrors.name ? { error: fieldErrors.name } : {})}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          {...(fieldErrors.email ? { error: fieldErrors.email } : {})}
        />
        <TextAreaField
          label="Message"
          name="message"
          required
          rows={7}
          {...(fieldErrors.message ? { error: fieldErrors.message } : {})}
        />

        {/* Honeypot. Hidden from readers and assistive technology, visible to bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Leave this empty</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {formError && (
          <p role="alert" className="font-mono text-xs tracking-[0.06em] text-ember">
            {formError}
          </p>
        )}

        <div>
          <Button
            type="submit"
            variant="link"
            size="md"
            disabled={!deliverable || state === 'sending'}
            className="group no-underline"
          >
            {state === 'sending' ? 'Sending…' : 'Send'}
            <span
              aria-hidden="true"
              className="transition-transform duration-500 group-enabled:group-hover:translate-x-1.5"
            >
              →
            </span>
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
