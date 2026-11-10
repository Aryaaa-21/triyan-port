import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nothing here',
  robots: { index: false, follow: true },
};

/**
 * A 404 that belongs to this site rather than to the framework. No apology, no
 * exclamation mark, no broken-robot illustration.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="gutter mx-auto measure-prose flex min-h-[70vh] flex-col justify-center"
    >
      <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">404</p>
      <h1 className="mt-6 font-display text-4xl leading-tight font-light tracking-tight">
        Nothing lives at this address.
      </h1>
      <p className="mt-6 font-reading text-lg leading-prose text-fg-muted">
        Some things are lost, some were never written, and some were taken down. Whichever this is,
        the archive is still here.
      </p>
      <div className="mt-10 flex gap-8">
        <Link
          href="/writings"
          className="font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-accent"
        >
          Enter the archive
        </Link>
        <Link
          href="/"
          className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
