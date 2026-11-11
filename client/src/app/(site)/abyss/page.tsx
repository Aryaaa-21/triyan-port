import type { Metadata } from 'next';
import { fetchAbyssSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';
import { SplitText } from '@/components/motion/split-text';
import { Parallax } from '@/components/motion/parallax';
import { Reveal } from '@/components/ui/reveal';

export const metadata: Metadata = {
  title: 'ABYSS',
  description: 'ABYSS — soul is deeper than the abyss. A creative identity by Triyan.',
  alternates: { canonical: `${siteUrl}/abyss` },
  openGraph: {
    title: 'ABYSS — Triyan',
    description: 'soul is deeper than the abyss',
    url: `${siteUrl}/abyss`,
  },
};

/**
 * ABYSS is introduced, not sold. There is no cart, no product and no price,
 * because none exists. The register is harder than the literary pages —
 * blackletter, hairlines, outlined type — inside the same token system.
 */
export default async function AbyssPage() {
  const abyss = await fetchAbyssSafely();
  const name = abyss?.name || 'ABYSS';

  return (
    <main id="main" className="overflow-x-clip pb-32">
      {/* ------------------------------------------------------------ mark */}
      <section className="gutter relative flex min-h-[80svh] flex-col justify-center">
        <Parallax
          speed={-0.25}
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 text-center"
        >
          <span className="abyss-outline font-abyss text-[38vw] leading-none select-none">
            {name}
          </span>
        </Parallax>
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="font-abyss text-7xl leading-none font-normal sm:text-9xl lg:text-[11rem]">
            <SplitText text={name} step={90} />
          </h1>
          {abyss?.tagline && (
            <p className="mt-10 font-abyss-ui text-sm tracking-[0.3em] text-fg-muted uppercase">
              {abyss.tagline}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------ philosophy */}
      {abyss?.philosophy && (
        <section className="gutter">
          <div className="mx-auto max-w-6xl border-t border-border-strong py-24 sm:py-32">
            <p className="font-abyss-ui text-2xs tracking-[0.3em] text-fg-subtle uppercase">
              Philosophy
            </p>
            <Reveal>
              <blockquote className="mt-10 max-w-4xl font-display text-4xl leading-tight font-light tracking-tight text-fg sm:text-6xl">
                {abyss.philosophy}
              </blockquote>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- now */}
      {abyss?.direction && (
        <section className="gutter">
          <div className="mx-auto grid max-w-6xl gap-10 border-t border-border-strong py-24 sm:grid-cols-[12rem_1fr]">
            <p className="font-abyss-ui text-2xs tracking-[0.3em] text-fg-subtle uppercase">Now</p>
            <Reveal>
              <p className="max-w-prose font-reading text-xl leading-prose text-fg-muted">
                {abyss.direction}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- future */}
      <section aria-labelledby="abyss-future" className="gutter">
        <div className="mx-auto max-w-6xl border-t border-border-strong py-24">
          <h2
            id="abyss-future"
            className="font-abyss-ui text-2xs tracking-[0.3em] text-fg-subtle uppercase"
          >
            What comes next
          </h2>
          {/*
          Reserved spaces, deliberately empty. Nothing is listed because nothing has
          been released; these fill from the CMS when it has.
        */}
          <div className="mt-10 grid gap-px border border-border-strong bg-border-strong sm:grid-cols-2">
            {[
              {
                label: 'Garments',
                note: 'Released pieces will be shown here, when there are any.',
              },
              {
                label: 'Ventures',
                note: 'Future work under the ABYSS name will be announced here.',
              },
            ].map((space) => (
              <div key={space.label} className="flex min-h-64 flex-col justify-between bg-bg p-8">
                <p className="font-abyss text-4xl">{space.label}</p>
                <p className="max-w-xs font-ui text-xs text-fg-subtle">{space.note}</p>
              </div>
            ))}
          </div>
          {abyss?.comingSoonNote && (
            <p className="mt-12 font-abyss-ui text-xs tracking-[0.3em] text-fg-subtle uppercase">
              {abyss.comingSoonNote}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
