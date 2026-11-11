import Image from '@/lib/image';
import type { AboutDto } from '@triyan/shared';
import { SplitText } from '@/components/motion/split-text';
import { SectionIntro } from '@/components/editorial';
import { Reveal } from '@/components/ui/reveal';
import { TriyanBio } from '@/features/content/triyan-bio';

/**
 * 02 — Triyan. Identity through type, not a greeting. The left carries the name;
 * the right is the portrait when one exists, and otherwise a quiet composition of
 * the two facts the page can state with certainty: since 2016, in two languages.
 * Triyan's bio follows the portrait on smaller screens; on large ones it sits under
 * the name, on the same left edge, with the portrait beside them.
 */
export function HomeHero({ about }: { about: AboutDto | null }) {
  const since = about?.writingSince || '2016';
  return (
    <section
      id="triyan"
      aria-labelledby="triyan-heading"
      // Focus lands here after "Scroll to enter"; it is a target, not a control.
      tabIndex={-1}
      className="gutter scroll-mt-20 overflow-x-clip outline-none"
    >
      <div className="mx-auto max-w-[90rem] pt-16 pb-28 sm:pt-24 lg:pb-40">
        <SectionIntro index="02" label="Triyan" className="mb-14 sm:mb-20" />
        {/* Large screens: name, roles and bio share one left edge; the portrait stands
            to the right, level with the name. Smaller screens: name, portrait, bio. */}
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          <div className="lg:col-span-8 lg:row-start-1">
            {/* Held still, on the same left edge as the roles and the bio below. */}
            <h1
              id="triyan-heading"
              className="font-display text-[clamp(4rem,14vw,14rem)] leading-[0.82] font-light tracking-[-0.04em] whitespace-nowrap uppercase"
            >
              <SplitText text="Triyan" step={70} />
            </h1>
            <Reveal stagger={2}>
              <p className="mt-10 font-display text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] font-light text-fg-muted italic">
                poet.
                <br />
                <span className="pl-[1.2em]">writer.</span>
                <br />
                <span className="pl-[2.4em]">author.</span>
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:pt-6">
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
          <Reveal stagger={2} className="lg:col-span-6 lg:row-start-2">
            <TriyanBio />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
