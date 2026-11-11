import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import NotFound from './not-found';

/**
 * The last line of defence. A reader must never see a stack trace, and the message
 * must not pretend the failure is their fault.
 */
export function ErrorPage({ error, reset }: { error: unknown; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error', error instanceof Error ? error.message : error);
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
    </main>
  );
}

/**
 * The error boundary for every page: a missing page gets the site's 404, anything else
 * the message above. "Try again" reloads the page.
 */
export default function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  return <ErrorPage error={error} reset={() => window.location.reload()} />;
}
