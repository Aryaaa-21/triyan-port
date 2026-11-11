import Image from 'next/image';
import type { AboutDto } from '@triyan/shared';
import { SplitText } from '@/components/motion/split-text';
import { SectionIntro } from '@/components/editorial';
import { Reveal } from '@/components/ui/reveal';

/**
 * 02 — Triyan. Identity through type, not a greeting. The left carries the name;
 * the right is the portrait when one exists, and otherwise a quiet composition of
 * the two facts the page can state with certainty: since 2016, in two languages.
 */
export function HomeHero({ about }: { about: AboutDto | null }) {
  const since = about?.writingSince || '2016';
  return (
    <section id="triyan" aria-labelledby="triyan-heading" className="gutter scroll-mt-20">
      <div className="mx-auto max-w-[90rem] pt-16 pb-28 sm:pt-24 lg:pb-40">
        <SectionIntro index="02" label="Triyan" className="mb-14 sm:mb-20" />
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <h1
              id="triyan-heading"
              className="font-display text-[clamp(4rem,14vw,14rem)] leading-[0.82] font-light tracking-[-0.04em] whitespace-nowrap uppercase"
            >
              <SplitText text="Triyan" step={70} />
            </h1>
            <Reveal stagger={2}>
              <p className="mt-10 pl-[0.4em] font-display text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] font-light text-fg-muted italic sm:pl-[1.6em]">
                poet.
                <br />
                <span className="pl-[1.2em]">writer.</span>
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:pt-6">
            {about?.portraitUrl ? (
              <Reveal variant="clip">
                <div className="relative aspect-[3/4] w-full max-w-sm bg-surface lg:ml-auto">
                  <Image
                    src={about.portraitUrl}
                    alt="Portrait of Triyan"
                    fill
                    sizes="(min-width: 1024px) 28vw, 80vw"
                    className="object-cover grayscale"
                  />
                </div>
              </Reveal>
            ) : (
              <Reveal stagger={3}>
                <div className="border-l border-border pl-6 lg:ml-auto lg:max-w-xs">
                  <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
                    Writing since
                  </p>
                  <p className="outline-numeral mt-3 font-display text-[clamp(4rem,9vw,7rem)] leading-none font-light tabular-nums">
                    {since}
                  </p>
                  <p className="mt-8 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
                    In
                  </p>
                  <p className="mt-2 font-display text-2xl font-light text-fg-muted">
                    English <span className="text-fg-subtle">·</span>{' '}
                    <span lang="hi" className="font-reading-deva">
                      हिन्दी
                    </span>
                  </p>
                </div>
              </Reveal>
            )}
          </div>
        </div>

        <Reveal stagger={2}>
          <p className="mt-20 max-w-2xl font-reading text-xl leading-prose text-fg-muted lg:mt-28 lg:ml-[33%]">
            {about?.statement || 'An archive of everything that words cannot contain.'} Poetry on
            love and its absence, on grief, mortality and existence.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
