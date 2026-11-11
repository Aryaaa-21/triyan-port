import { SplitText } from '@/components/motion/split-text';
import { CosmicField } from '@/features/cosmos/cosmic-field';

/**
 * The opening: "Welcome to Abyss ~ Triyan" over a slow drift through stars.
 *
 * The text and the static backdrop are server-rendered and readable instantly.
 * The WebGL field is an enhancement layered underneath; if it never loads, the
 * opening is still complete. The bottom fades into the page so the reader moves
 * from the space into the site rather than past a banner.
 */
export function HomeOpening() {
  return (
    <section
      aria-label="Welcome"
      className="gutter relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden"
    >
      {/* Static depth cue: the fallback, and the base the stars sit on. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--fg)_7%,transparent),transparent_70%)]"
      />
      <div className="absolute inset-0 -z-10">
        <CosmicField />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-b from-transparent to-bg"
      />

      <div className="relative text-center">
        <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
          <SplitText text="Welcome to" delay={200} step={35} />
        </p>
        <h2 className="mt-6 font-abyss text-7xl leading-none font-normal sm:text-9xl">
          <SplitText text="Abyss" delay={650} step={110} />
        </h2>
        <p className="mt-8 font-display text-xl font-light tracking-[0.4em] text-fg-muted">
          <SplitText text="~ Triyan" delay={1350} step={60} />
        </p>
      </div>

      <a
        href="#hero"
        className="opening-cue absolute bottom-8 left-1/2 -translate-x-1/2 font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
      >
        Enter
        <span
          aria-hidden="true"
          className="mt-3 block h-10 w-px translate-x-[1.1rem] bg-fg-subtle/60"
        />
      </a>
    </section>
  );
}
