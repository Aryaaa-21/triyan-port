import Link from 'next/link';
import type { Metadata } from 'next';
import { ArtDefs, CategoryArt } from '@/components/art';

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
      className="gutter mx-auto grid min-h-[80vh] max-w-[90rem] items-center gap-12 py-20 md:grid-cols-12 md:gap-8"
    >
      <ArtDefs />
      <div className="relative aspect-[4/5] w-full max-w-sm md:col-span-4">
        <CategoryArt category="ABSENCE_LOSS" className="absolute inset-0" decorative={false} />
      </div>
      <div className="md:col-span-6 md:col-start-6">
        <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">404</p>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight font-light tracking-tight">
          Nothing lives at this address.
        </h1>
        <p className="mt-6 font-reading text-lg leading-prose text-fg-muted">
          Some things are lost, some were never written, and some were taken down. Whichever this
          is, the archive is still here.
        </p>
        <div className="mt-10 flex gap-8">
          <Link
            href="/writings"
            className="font-mono text-xs tracking-[0.2em] text-fg uppercase no-underline hover:text-accent"
          >
            Enter the archive
          </Link>
          <Link
            href="/"
            className="font-mono text-xs tracking-[0.2em] text-fg-subtle uppercase no-underline hover:text-fg"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
