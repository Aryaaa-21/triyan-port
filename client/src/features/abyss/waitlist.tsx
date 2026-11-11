'use client';

import { useState } from 'react';

type State = 'idle' | 'sending' | 'joined' | 'failed';

/**
 * ENTER THE ABYSS — the pre-launch waitlist. An address and an explicit yes; nothing
 * else is asked for. When `open` is false (the API is unreachable) the form is
 * shown closed rather than pretending to save an address it cannot save.
 */
export function Waitlist({ open = true }: { open?: boolean }) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!open) return;
    const form = new FormData(event.currentTarget);
    // A light check for the reader's sake; the API validates properly (shared zod
    // schema) — importing zod here would add ~40 KB to this page for one field.
    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();
    const consent = form.get('consent') === 'on';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That address does not look complete.');
      return;
    }
    if (!consent) {
      setError('Tick the box to say yes.');
      return;
    }
    const payload = { email, consent: true, website: String(form.get('website') ?? '') };
    setError('');
    setState('sending');
    try {
      const response = await fetch('/api/public/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? 'failed');
      }
      setState('joined');
    } catch (cause) {
      setState('failed');
      setError(
        cause instanceof Error && cause.message !== 'failed'
          ? cause.message
          : 'The address could not be added. Try again in a moment.',
      );
    }
  };

  if (state === 'joined') {
    return (
      <div role="status">
        <p className="font-abyss text-[clamp(3rem,8vw,6rem)] leading-none text-white">
          You have entered.
        </p>
        <p className="mt-6 font-reading text-lg text-white/65">
          You will hear when ABYSS opens — and nothing else.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="max-w-2xl">
      <h2 className="font-abyss text-[clamp(3rem,8vw,6rem)] leading-none font-normal text-white">
        Enter the abyss
      </h2>
      <p className="mt-6 max-w-md font-reading text-lg leading-prose text-white/65">
        Be told when the first collection opens.
      </p>
      <fieldset disabled={!open || state === 'sending'} className="m-0 mt-10 border-0 p-0">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="sr-only">Email address</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="your email"
              disabled={!open || state === 'sending'}
              aria-invalid={error && !error.startsWith('Tick') ? true : undefined}
              aria-describedby="waitlist-note"
              className="w-full border-0 border-b border-white/30 bg-transparent py-3 font-display text-2xl font-light text-white placeholder:text-white/35 focus:border-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <button
            type="submit"
            disabled={!open || state === 'sending'}
            className="group inline-flex items-center gap-3 py-3 font-mono text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state === 'sending' ? 'Joining…' : 'Join the waitlist'}
            <span
              aria-hidden="true"
              className="transition-transform duration-500 group-enabled:group-hover:translate-x-1.5"
            >
              →
            </span>
          </button>
        </div>
        <label className="mt-6 flex items-start gap-3 font-reading text-base text-white/70">
          <input
            name="consent"
            type="checkbox"
            disabled={!open}
            className="mt-1.5 size-4 accent-white"
          />
          <span>Yes — tell me when ABYSS launches. My address is used for nothing else.</span>
        </label>
        {/* Honeypot. Hidden from readers and assistive technology. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="waitlist-website">Leave this empty</label>
          <input
            id="waitlist-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </fieldset>
      <p
        id="waitlist-note"
        role={error ? 'alert' : undefined}
        className="mt-4 min-h-5 font-mono text-2xs tracking-[0.14em] text-white/55"
      >
        {error || (open ? '' : 'The waitlist is not open yet.')}
      </p>
    </form>
  );
}
