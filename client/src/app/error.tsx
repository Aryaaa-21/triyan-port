'use client';

import { useEffect } from 'react';

/**
 * The last line of defence. A reader must never see a stack trace, and the message
 * must not pretend the failure is their fault.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest correlates with the server log without exposing anything.
    console.error('Unhandled error', error.digest ?? error.message);
  }, [error]);

  return (
    <main
      id="main"
      className="gutter mx-auto measure-prose flex min-h-[70vh] flex-col justify-center"
    >
      <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        Something broke
      </p>
      <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight font-light tracking-tight">
        The archive is briefly out of reach.
      </h1>
      <p className="mt-6 font-reading text-lg leading-prose text-fg-muted">
        This is a fault on our side, not yours. The writing is intact.
      </p>
      <div className="mt-10">
        <button
          type="button"
          onClick={reset}
          className="font-mono text-xs tracking-[0.2em] text-fg uppercase hover:text-accent"
        >
          Try again
        </button>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-2xs text-fg-subtle">Reference: {error.digest}</p>
      )}
    </main>
  );
}
