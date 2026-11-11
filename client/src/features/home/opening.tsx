import { Reveal } from '@/components/ui/reveal';

/**
 * The opening.
 *
 * A lightweight treatment for now: type emerging from black, carried entirely by CSS.
 * The cosmic/3D layer belongs to Phase 4, and building a throwaway particle field
 * here would be work thrown away. This is a server component with no JavaScript.
 */
export function HomeOpening() {
  return (
    <section
      aria-label="Welcome"
      className="gutter relative flex min-h-[72svh] items-center justify-center overflow-hidden"
    >
      {/* A single soft depth cue, not a gradient wash. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--fg)_6%,transparent),transparent_70%)]"
      />
      <div className="relative text-center">
        <Reveal>
          <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">Welcome to</p>
        </Reveal>
        <Reveal stagger={1}>
          <h2 className="mt-6 font-abyss text-6xl leading-none font-normal sm:text-8xl">Abyss</h2>
        </Reveal>
        <Reveal stagger={2}>
          <p className="mt-6 font-display text-xl font-light tracking-widest text-fg-muted">
            ~ Triyan
          </p>
        </Reveal>
      </div>
    </section>
  );
}
