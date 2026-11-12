import type { AboutDto, AbyssDto } from '@triyan/shared';
import { ArrowLink, SectionIntro } from '@/components/editorial';
import { Parallax } from '@/components/motion/parallax';
import { Reveal } from '@/components/ui/reveal';
import { REMEMBER } from '@/content/triyan';
import { wordmark } from '@/lib/wordmark';

/** 07 — ABYSS. A doorway: the world beyond the words, and the sense that it is coming. */
export function AbyssDoor({ abyss }: { abyss: AbyssDto | null }) {
  if (!abyss?.published) return null;
  return (
    <section
      aria-labelledby="abyss-heading"
      className="abyss-door relative overflow-hidden bg-black text-white"
    >
      <Parallax
        speed={-0.15}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center"
      >
        <span className="abyss-outline font-abyss text-[34vw] leading-none select-none">
          {wordmark(abyss.name)}
        </span>
      </Parallax>
      <div className="gutter relative">
        <div className="mx-auto max-w-[90rem] py-32 lg:py-48">
          <SectionIntro
            index="07"
            label="ABYSS"
            className="mb-20 [&_span]:text-white/45 [&_span:last-child]:bg-white/15"
          />
          <Reveal variant="blur">
            <h2
              id="abyss-heading"
              className="font-abyss pb-[1.1em] pl-[0.18em] text-[clamp(4rem,12vw,10rem)] leading-[1.15] font-normal"
            >
              {wordmark(abyss.name)}
            </h2>
          </Reveal>
          {abyss.tagline && (
            <p className="mt-10 font-abyss-ui text-sm tracking-[0.35em] text-white/70 uppercase">
              {abyss.tagline}
            </p>
          )}
          {abyss.philosophy && (
            <p className="mt-16 max-w-xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-light text-white/85">
              {abyss.philosophy}
            </p>
          )}
          <div className="mt-16">
            <ArrowLink href="/abyss" className="text-white hover:text-white/70">
              Enter the abyss
            </ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 08 — About: a few sentences of the writer, and the way to more. */
export function AboutIntro({ about }: { about: AboutDto | null }) {
  const paragraphs = (about?.body ?? '').split('\n').filter((p) => p.trim());
  // The first paragraph is Triyan describing himself, in the first person.
  const lead = paragraphs[0];
  return (
    <section aria-labelledby="about-heading" className="gutter">
      <div className="mx-auto grid max-w-[90rem] gap-12 py-28 lg:grid-cols-12 lg:gap-8 lg:py-40">
        <div className="lg:col-span-4">
          <SectionIntro index="08" label="About" className="mb-10" />
          <h2 id="about-heading" className="font-display text-5xl font-light tracking-tight">
            The writer
          </h2>
        </div>
        <div className="lg:col-span-6 lg:col-start-6 lg:pt-20">
          {lead && (
            <Reveal>
              <p className="font-reading text-xl leading-prose text-fg-muted">{lead}</p>
            </Reveal>
          )}
          <div className="mt-10">
            <ArrowLink href="/about">More about Triyan</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 09 — Contact: the final door. */
export function ContactDoor() {
  return (
    <section aria-labelledby="contact-heading" className="gutter border-t border-border">
      <div className="mx-auto max-w-[90rem] py-28 lg:py-40">
        <SectionIntro index="09" label="Contact" className="mb-16" />
        <Reveal variant="blur">
          <h2
            id="contact-heading"
            className="max-w-4xl font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] font-light tracking-tight"
          >
            If something here stayed with you,
            <span className="text-fg-muted italic"> write.</span>
          </h2>
        </Reveal>
        <div className="mt-14">
          <ArrowLink href="/contact">The last door</ArrowLink>
        </div>
      </div>
    </section>
  );
}

/** 10 — Exit. The site ends by letting go: thanks, the mark, and a fall into black. */
export function Exit() {
  return (
    <section aria-label="Exit" className="exit gutter relative overflow-hidden">
      <div className="mx-auto flex min-h-[80svh] max-w-[90rem] flex-col items-center justify-center py-32 text-center">
        <Reveal variant="blur">
          <p className="mx-auto mb-24 max-w-3xl font-display text-[clamp(1.5rem,2.8vw,2.25rem)] leading-snug font-light text-fg-muted italic">
            {REMEMBER}
          </p>
        </Reveal>
        <Reveal variant="blur">
          <p className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] font-light tracking-tight">
            Thank you
            <br />
            <span className="text-fg-muted italic">for entering.</span>
          </p>
        </Reveal>
        <Reveal stagger={2}>
          <p className="mt-20 font-mono text-xs tracking-[0.5em] text-fg-subtle uppercase">
            Triyan Writes
          </p>
          <span
            aria-hidden="true"
            className="exit-line mx-auto mt-6 block h-20 w-px bg-border-strong"
          />
          <p className="mt-6 font-abyss text-4xl text-fg-muted">abyss</p>
        </Reveal>
      </div>
    </section>
  );
}
