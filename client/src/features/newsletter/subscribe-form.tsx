import { useId, useState } from 'react';

type State = 'idle' | 'sending' | 'confirm' | 'joined' | 'failed';

/**
 * "Tell me when there is a new writing." An address and an explicit yes. The API
 * answers with what happens next: a confirmation email to open, or — while no email
 * provider is connected — simply that the address is on the list.
 */
export function SubscribeForm({ className }: { className?: string }) {
  const id = useId();
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // A light check for the reader's sake; the API validates properly.
    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That address does not look complete.');
      return;
    }
    if (form.get('consent') !== 'on') {
      setError('Tick the box to say yes.');
      return;
    }
    setError('');
    setState('sending');
    try {
      const response = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, consent: true, website: String(form.get('website') ?? '') }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { outcome?: string };
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(body.error?.message ?? 'failed');
      setState(body.data?.outcome === 'SUBSCRIBED' ? 'joined' : 'confirm');
    } catch (cause) {
      setState('failed');
      setError(
        cause instanceof Error && cause.message !== 'failed'
          ? cause.message
          : 'The address could not be added. Try again in a moment.',
      );
    }
  };

  if (state === 'confirm' || state === 'joined') {
    return (
      <div role="status" className={className}>
        <p className="font-display text-2xl leading-snug font-light text-fg">
          {state === 'confirm' ? 'Check your inbox.' : 'You are on the list.'}
        </p>
        <p className="mt-2 font-reading text-base leading-prose text-fg-muted">
          {state === 'confirm'
            ? 'A confirmation link is on its way. Open it, and new writings will reach you.'
            : 'When a new writing is published, it will reach you by email.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className={className}>
      <label
        htmlFor={`${id}-email`}
        className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
      >
        New writings, by email
      </label>
      <div className="mt-2 flex items-end gap-4 border-b border-border-strong focus-within:border-fg">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent py-3 font-reading text-lg text-fg placeholder:text-fg-subtle/70 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="group shrink-0 py-3 font-mono text-xs tracking-[0.2em] text-fg uppercase transition-colors hover:text-accent disabled:opacity-40"
        >
          {state === 'sending' ? 'Adding…' : 'Subscribe'}{' '}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-500 group-enabled:group-hover:translate-x-1.5"
          >
            →
          </span>
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 font-ui text-xs leading-relaxed text-fg-subtle">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 shrink-0 accent-current" />
        Yes, email me when Triyan publishes a new writing. One click to unsubscribe, any time.
      </label>

      {/* Honeypot. Hidden from readers and assistive technology, visible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-3 font-mono text-xs tracking-[0.06em] text-ember"
        >
          {error}
        </p>
      )}
    </form>
  );
}
