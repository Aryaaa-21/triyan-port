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
export function ContactForm() {
  const [state, setState] = useState<State>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      <div role="status" className="border border-border p-8">
        <p className="font-display text-2xl font-light text-fg">Your message was received.</p>
        <p className="mt-3 font-reading text-base text-fg-muted">
          Triyan reads everything that arrives here. A reply may take a while.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-6">
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
        <p role="alert" className="font-ui text-xs text-ember">
          {formError}
        </p>
      )}

      <div>
        <Button type="submit" variant="solid" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </form>
  );
}
