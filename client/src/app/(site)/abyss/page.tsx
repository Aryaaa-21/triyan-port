import type { Metadata } from 'next';
import { fetchAbyssSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';

export const metadata: Metadata = {
  title: 'ABYSS',
  description: 'ABYSS — soul is deeper than the abyss. A creative identity by Triyan.',
  alternates: { canonical: `${siteUrl}/abyss` },
};

/**
 * ABYSS is introduced, not sold. There is no cart, no product and no price, because
 * none exists. The visual register is more brutalist than the literary pages while
 * staying inside the same token system.
 */
export default async function AbyssPage() {
  const abyss = await fetchAbyssSafely();

  return (
    <main id="main" className="gutter mx-auto max-w-5xl pt-20 pb-32">
      <h1 className="font-abyss text-7xl leading-none font-normal sm:text-9xl">
        {abyss?.name || 'ABYSS'}
      </h1>

      {abyss?.tagline && (
        <p className="mt-8 font-abyss-ui text-sm tracking-[0.3em] text-fg-muted uppercase">
          {abyss.tagline}
        </p>
      )}

      <hr aria-hidden="true" className="my-14 border-border-strong" />

      {abyss?.philosophy && (
        <p className="max-w-2xl font-display text-3xl leading-snug font-light tracking-tight text-fg">
          {abyss.philosophy}
        </p>
      )}

      {abyss?.direction && (
        <p className="mt-10 max-w-prose font-reading text-lg leading-prose text-fg-muted">
          {abyss.direction}
        </p>
      )}

      {abyss?.comingSoonNote && (
        <p className="mt-16 font-abyss-ui text-xs tracking-[0.3em] text-fg-subtle uppercase">
          {abyss.comingSoonNote}
        </p>
      )}
    </main>
  );
}
