import type { CSSProperties } from 'react';
import { SplitText } from '@/components/motion/split-text';
import { BlackHoleBackground } from '@/features/blackhole/background';
import WindStreamCursor from '@/components/ui/wind-stream-cursor';

/**
 * 01 — Entry: a scroll scene.
 *
 * The section is tall; its stage stays pinned while you scroll through it. Scroll
 * progress (--bh-progress, set by the black hole) drives the fall:
 *   0.00  "Welcome to Abyss", the black hole turning, stars falling in
 *   →     the camera falls toward the shadow; stars streak outward; the words part —
 *         "Welcome to" rises, "Abyss" grows and dissolves, "Triyan Writes" sinks
 *   0.80  inside the dark, a single line appears: "A soul is deeper than the abyss…"
 *   1.00  the stage releases and the page continues
 * Scrolling is never hijacked: it is ordinary scrolling past a pinned stage. Under
 * reduced motion the section is one screen tall, nothing moves, and the line is shown
 * beneath the title instead.
 *
 * The type is laid out in units of the hole's radius — the shader's own formula — so
 * it lands in the same place on every screen.
 */
const stage: CSSProperties & Record<string, string> = {
  containerType: 'size',
  // Mirrors the shader: 22% of the shorter side, never under 104px.
  '--bh-r': 'max(22cqmin, 104px)',
};

export function HomeOpening({ line }: { line: string }) {
  return (
    <section
      data-scroll-scene
      aria-label="Welcome"
      className="opening abyss-door relative isolate bg-black text-white"
    >
      <div
        className="opening-stage sticky top-16 h-[calc(100svh-4rem)] min-h-[34rem] overflow-hidden"
        style={stage}
      >
        <BlackHoleBackground />
        <WindStreamCursor />

        <div className="pointer-events-none absolute inset-0">
          <p
            className="opening-welcome absolute left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.4em] whitespace-nowrap text-white/60 uppercase"
            style={{ top: 'calc(50% - var(--bh-r) * 1.66)' }}
          >
            <SplitText text="Welcome to" delay={300} step={35} />
          </p>
          <p
            className="opening-abyss absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-abyss leading-none font-normal whitespace-nowrap text-white"
            style={{ top: 'calc(50% - var(--bh-r) * 0.3)', fontSize: 'calc(var(--bh-r) * 0.5)' }}
          >
            <SplitText text="abyss" delay={700} step={110} />
          </p>
          <p
            className="opening-name absolute left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.5em] whitespace-nowrap text-white/70 uppercase"
            style={{ top: 'calc(50% + var(--bh-r) * 1.48)' }}
          >
            <SplitText text="Triyan Writes" delay={1500} step={55} />
          </p>

          {/* Revealed in the dark, once the fall is complete. */}
          <p className="opening-statement gutter absolute inset-x-0 top-1/2 mx-auto max-w-3xl -translate-y-1/2 text-center font-display text-[clamp(1.75rem,4.2vw,3.5rem)] leading-tight font-light text-white/90">
            {line}
          </p>
        </div>

        <a
          href="#triyan"
          className="opening-cue absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.3em] text-white/55 uppercase no-underline hover:text-white"
        >
          Scroll to enter
          <span aria-hidden="true" className="mx-auto mt-3 block h-10 w-px bg-white/40" />
        </a>
      </div>
    </section>
  );
}
