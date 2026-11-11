import { SplitText } from '@/components/motion/split-text';
import { CosmicField } from '@/features/cosmos/cosmic-field';
import WindStreamCursor from '@/components/ui/wind-stream-cursor';

/**
 * 01 — Entry: "Welcome to Abyss", then "Triyan Writes", over a slow drift through stars.
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

      {/* Grey wind trails the pointer through the entry. Fine pointers only. */}
      <WindStreamCursor />

      <div className="relative text-center">
        <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
          <SplitText text="Welcome to" delay={200} step={35} />
        </p>
        <p className="mt-6 font-abyss text-7xl leading-none font-normal sm:text-9xl">
          <SplitText text="Abyss" delay={650} step={110} />
        </p>
        <p className="mt-10 font-mono text-xs tracking-[0.5em] text-fg-muted uppercase">
          <SplitText text="Triyan Writes" delay={1500} step={55} />
        </p>
      </div>

      <a
        href="#triyan"
        className="opening-cue absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.3em] text-fg-subtle uppercase no-underline hover:text-fg"
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
