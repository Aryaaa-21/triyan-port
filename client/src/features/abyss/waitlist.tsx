'use client';

import { useState } from 'react';

type State = 'idle' | 'sending' | 'joined' | 'failed';

/**
 * ENTER THE ABYSS — the waitlist. Without `onJoin` it renders closed: the field is
 * visible but disabled, and the page says plainly that the list is not open yet.
 * It never pretends to have saved an address it cannot save.
 */
export function Waitlist({ onJoin }: { onJoin?: (email: string) => Promise<void> }) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const open = Boolean(onJoin);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onJoin) return;
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That address does not look complete.');
      return;
    }
    setError('');
    setState('sending');
    try {
      await onJoin(email);
      setState('joined');
    } catch {
      setState('failed');
      setError('The address could not be added. Try again in a moment.');
    }
  };

  if (state === 'joined') {
    return (
      <p role="status" className="font-display text-3xl font-light text-white">
        You are on the list.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="max-w-2xl">
      <p className="font-abyss-ui text-xs tracking-[0.35em] text-white/60 uppercase">
        Enter the abyss
      </p>
      <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your email"
            disabled={!open || state === 'sending'}
            aria-invalid={error ? true : undefined}
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
      <p
        id="waitlist-note"
        role={error ? 'alert' : undefined}
        className="mt-4 font-mono text-2xs tracking-[0.14em] text-white/50"
      >
        {error ||
          (open
            ? 'One email when the first collection arrives. Nothing else.'
            : 'The waitlist is not open yet.')}
      </p>
    </form>
  );
}
