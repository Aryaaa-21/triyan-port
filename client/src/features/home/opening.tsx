import type { CSSProperties } from 'react';
import { SplitText } from '@/components/motion/split-text';
import { BlackHoleBackground } from '@/features/blackhole/background';
import WindStreamCursor from '@/components/ui/wind-stream-cursor';

/**
 * 01 — Entry: "Welcome to Abyss", set inside the shadow of a black hole.
 *
 * The black hole is a living background (see BlackHoleBackground). The type is laid
 * out in units of the hole's radius — the same formula the shader uses — so on any
 * screen "Welcome to" sits above the dome, "Abyss" inside the dark above the band of
 * the disk, and "Triyan Writes" beneath the lower arc. It is always night here, whichever theme is chosen.
 */
const hole: CSSProperties & Record<string, string> = {
  containerType: 'size',
  // Mirrors the shader: 22% of the shorter side, never under 104px.
  '--bh-r': 'max(22cqmin, 104px)',
};

export function HomeOpening() {
  return (
    <section
      aria-label="Welcome"
      className="opening abyss-door relative isolate h-[calc(100svh-4rem)] min-h-[34rem] overflow-hidden bg-black text-white"
      style={hole}
    >
      <BlackHoleBackground />
      <WindStreamCursor />

      <div className="opening-type pointer-events-none absolute inset-0">
        <p
          className="absolute left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.4em] whitespace-nowrap text-white/60 uppercase"
          style={{ top: 'calc(50% - var(--bh-r) * 1.66)' }}
        >
          <SplitText text="Welcome to" delay={300} step={35} />
        </p>
        <p
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-abyss leading-none font-normal whitespace-nowrap text-white"
          style={{ top: 'calc(50% - var(--bh-r) * 0.3)', fontSize: 'calc(var(--bh-r) * 0.5)' }}
        >
          <SplitText text="Abyss" delay={700} step={110} />
        </p>
        <p
          className="absolute left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.5em] whitespace-nowrap text-white/70 uppercase"
          style={{ top: 'calc(50% + var(--bh-r) * 1.48)' }}
        >
          <SplitText text="Triyan Writes" delay={1500} step={55} />
        </p>
      </div>

      <a
        href="#triyan"
        className="opening-cue absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.3em] text-white/55 uppercase no-underline hover:text-white"
      >
        Enter
        <span
          aria-hidden="true"
          className="mt-3 block h-10 w-px translate-x-[1.1rem] bg-white/40"
        />
      </a>
    </section>
  );
}
