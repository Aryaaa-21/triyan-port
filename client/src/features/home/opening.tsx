import type { CSSProperties } from 'react';
import Image from '@/lib/image';
import { SplitText } from '@/components/motion/split-text';
import { FilmGrain } from '@/components/ui/film-grain';
import { ScrollCue } from './scroll-cue';
import { BlackHoleBackground } from '@/features/blackhole/background';

/**
 * The owner's front-page image of the black hole in black and white, straightened so
 * the disk lies level and centred on the hole, so it crops cleanly at any aspect ratio.
 * Sizes are in image pixels; `radius` is the shadow's.
 */
const FRONT = {
  src: '/images/landing-bw.jpg',
  width: 1560,
  height: 1000,
  radius: 146,
  // The disk's bright span is ~1040px; on tall screens at least this much stays in view.
  visibleWidth: 1160,
} as const;

/**
 * 01 — Entry: a scroll scene.
 *
 * The section is tall; its stage stays pinned while you scroll through it. Scroll
 * progress (--bh-progress, set by the black hole) drives the fall:
 *   0.00  "Welcome to abyss": the owner's image of the black hole, with stars
 *         glittering, shooting and falling in over it, and a light running round the rim
 *   →     the camera falls toward the shadow; stars streak outward; the words part —
 *         "Welcome to" rises, "abyss" grows and dissolves, "Triyan Writes" sinks
 *   0.80  inside the dark, a single line appears: "A soul is deeper than the abyss…"
 *   1.00  the stage releases and the page continues
 * Scrolling is never hijacked: it is ordinary scrolling past a pinned stage. Under
 * reduced motion the section is one screen tall, nothing moves, and the line is shown
 * beneath the title instead.
 *
 * The type is laid out in units of the hole's radius as the image is shown, so it
 * lands in the same place on every screen. On a phone the whole disk is in view, and
 * "abyss" keeps a readable size inside the hole.
 */
const stage: CSSProperties & Record<string, string> = {
  containerType: 'size',
  // The photo's width on screen: a cover fit, except on tall screens (phones), where it
  // is just wide enough to keep the whole disk in view. Mirrors coverScale() in the shader.
  '--bh-img-w': `max(100cqw, min(${((FRONT.width / FRONT.height) * 100).toFixed(2)}cqh, ${((FRONT.width / FRONT.visibleWidth) * 100).toFixed(2)}cqw))`,
  '--bh-r': `calc(var(--bh-img-w) * ${(FRONT.radius / FRONT.width).toFixed(5)})`,
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
        <div aria-hidden="true" className="opening-image">
          <Image
            src={FRONT.src}
            alt=""
            fill
            priority
            // On screens taller than the image's shape it is scaled to the height (cover),
            // so it is drawn wider than the viewport: 156vh at the image's 1560:1000.
            sizes="(max-aspect-ratio: 116/100) 135vw, (max-aspect-ratio: 39/25) 156vh, 100vw"
            className="object-cover object-center"
          />
        </div>
        <BlackHoleBackground cover={FRONT} />
        <FilmGrain />

        <div className="pointer-events-none absolute inset-0">
          <p
            className="opening-welcome absolute left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.4em] whitespace-nowrap text-white/60 uppercase"
            style={{ top: 'calc(50% - var(--bh-r) * 2.2)' }}
          >
            <SplitText text="Welcome to" delay={300} step={35} />
          </p>
          <p
            className="opening-abyss absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-abyss leading-none font-normal whitespace-nowrap text-white"
            style={{
              top: 'calc(50% - var(--bh-r) * 0.42)',
              // Half the radius on large screens; never under ~2.1rem on a phone.
              fontSize: 'clamp(calc(var(--bh-r) * 0.5), 2.1rem, calc(var(--bh-r) * 0.72))',
            }}
          >
            <SplitText text="abyss" delay={700} step={110} />
          </p>
          <p
            className="opening-name absolute left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.5em] whitespace-nowrap text-white/70 uppercase"
            style={{ top: 'calc(50% + var(--bh-r) * 2.1)' }}
          >
            <SplitText text="Triyan Writes" delay={1500} step={55} />
          </p>

          {/* Revealed in the dark, once the fall is complete. */}
          <p className="opening-statement gutter absolute inset-x-0 top-1/2 mx-auto max-w-3xl lg:max-w-none lg:whitespace-nowrap -translate-y-1/2 text-center font-display text-[clamp(1.75rem,4.2vw,3.5rem)] leading-tight font-light text-white/90">
            {line}
          </p>
        </div>

        <ScrollCue
          target="triyan"
          // The line in the dark is fully lit from 0.80 to 0.86: stop there and let it be read.
          rest={{ at: 0.83, ms: 2600 }}
          className="opening-cue absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-2xs tracking-[0.3em] text-white/55 uppercase no-underline hover:text-white"
        >
          Scroll to enter
          <span aria-hidden="true" className="mx-auto mt-3 block h-10 w-px bg-white/40" />
        </ScrollCue>
      </div>
    </section>
  );
}
