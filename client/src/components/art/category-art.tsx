import type { CategoryKey } from '@triyan/shared';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Original artwork for each of the eight categories, drawn in code.
 *
 * Monochrome, grainy and abstract by design: these are atmospheres for a theme,
 * never stand-ins for Triyan's photographs or for an Instagram post's own image.
 * Every image is deterministic (seeded), server-rendered, and costs no request.
 * Ink and ground follow the theme, so night is light-on-black and day is
 * ink-on-paper. Shared gradients and the grain filter live in <ArtDefs/>.
 *
 * Replace any of them with a real photograph by passing `src` to <CategoryPlate/>.
 */

/** Deterministic PRNG so the same category always draws the same picture. */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ink = (opacity: number): CSSProperties => ({ fill: 'var(--art-ink)', fillOpacity: opacity });
const line = (opacity: number, width = 1): CSSProperties => ({
  stroke: 'var(--art-ink)',
  strokeOpacity: opacity,
  strokeWidth: width,
  fill: 'none',
});

const W = 400;
const H = 500;

/** Rounds for compact path data: these drawings are inlined, so bytes matter. */
const n = (v: number) => Math.round(v * 10) / 10;

/**
 * Many strokes or dots, merged into a few paths by opacity bucket. One <path> with a
 * long `d` costs a fraction of hundreds of separately styled elements.
 */
const bucketed = (
  marks: { d: string; o: number }[],
  buckets: number,
  render: (d: string, opacity: number, i: number) => ReactNode,
) => {
  const groups: string[][] = Array.from({ length: buckets }, () => []);
  for (const m of marks) {
    const i = Math.min(buckets - 1, Math.floor(m.o * buckets));
    groups[i]?.push(m.d);
  }
  return groups.map((g, i) => (g.length ? render(g.join(''), (i + 0.5) / buckets, i) : null));
};

/* ------------------------------------------------------------ the eight */

/** Two lights on a dark horizon, reaching, never meeting. */
function LoveLonging() {
  return (
    <>
      <rect width={W} height={H} fill="url(#art-sky)" />
      <circle cx="118" cy="300" r="90" fill="url(#art-glow)" opacity="0.55" />
      <circle cx="290" cy="300" r="90" fill="url(#art-glow)" opacity="0.55" />
      <path d="M118 300 Q 204 214 290 300" style={line(0.18)} strokeDasharray="2 6" />
      <circle cx="118" cy="300" r="3.2" style={ink(0.95)} />
      <circle cx="290" cy="300" r="3.2" style={ink(0.95)} />
      <line x1="0" y1="352" x2={W} y2="352" style={line(0.22)} />
    </>
  );
}

/** An open doorway, lit, with nobody in it. */
function AbsenceLoss() {
  return (
    <>
      <rect width={W} height={H} style={ink(0.02)} />
      <rect x="150" y="120" width="100" height="250" fill="url(#art-door)" />
      <rect x="150" y="120" width="100" height="250" style={line(0.5)} />
      {/* light falling out across the floor */}
      <path d="M150 370 L250 370 L330 500 L70 500 Z" fill="url(#art-spill)" />
      <line x1="0" y1="370" x2={W} y2="370" style={line(0.16)} />
    </>
  );
}

/** Rain that does not stop, and the water it falls into. */
function GriefMelancholy() {
  const r = rng(3);
  const drops: { d: string; o: number }[] = [];
  for (let i = 0; i < 140; i += 1) {
    const x = r() * W;
    const y = r() * 380 - 40;
    const len = 18 + r() * 46;
    drops.push({ d: `M${n(x)} ${n(y)}l${n(-len * 0.12)} ${n(len)}`, o: r() });
  }
  let ripples = '';
  for (let i = 0; i < 9; i += 1) {
    const cx = 30 + r() * 340;
    const cy = 400 + r() * 80;
    const rx = 8 + r() * 30;
    const ry = 2 + r() * 4;
    ripples += `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0`;
  }
  return (
    <>
      <rect width={W} height={H} fill="url(#art-sky)" />
      <g className="art-rain">
        {bucketed(drops, 4, (d, o, i) => (
          <path key={i} d={d} style={line(0.08 + o * 0.32, 0.8)} />
        ))}
      </g>
      <line x1="0" y1="392" x2={W} y2="392" style={line(0.3)} />
      <path d={ripples} style={line(0.2)} />
    </>
  );
}

/** One figure, very small, in a very large field. */
function Existentialism() {
  return (
    <>
      <rect width={W} height={H} fill="url(#art-sky-deep)" />
      <line x1="0" y1="400" x2={W} y2="400" style={line(0.35)} />
      <rect x="0" y="400" width={W} height="100" style={ink(0.03)} />
      <line x1="268" y1="384" x2="268" y2="400" style={line(0.9, 1.4)} />
      <circle cx="268" cy="381" r="2" style={ink(0.9)} />
      <line x1="268" y1="400" x2="300" y2="404" style={line(0.18, 1)} />
    </>
  );
}

/** An eclipse: a black sun with a thin crown of light, and dust leaving it. */
function MortalityNothingness() {
  const r = rng(5);
  const dust: { d: string; o: number }[] = [];
  for (let i = 0; i < 90; i += 1) {
    const a = r() * Math.PI * 2;
    const d = 96 + Math.pow(r(), 0.6) * 200;
    // A zero-length segment with a round cap is a dot.
    dust.push({ d: `M${n(200 + Math.cos(a) * d)} ${n(230 + Math.sin(a) * d)}h0`, o: r() });
  }
  const dots = bucketed(dust, 3, (d, o, i) => (
    <path
      key={i}
      d={d}
      style={{ ...line(0.1 + o * 0.45, 1.2 + i * 0.8), strokeLinecap: 'round' }}
    />
  ));
  return (
    <>
      <rect width={W} height={H} style={ink(0.015)} />
      <circle cx="200" cy="230" r="150" fill="url(#art-corona)" />
      <g className="art-drift">{dots}</g>
      <circle cx="200" cy="230" r="84" style={{ fill: 'var(--art-ground)' }} />
      <circle cx="200" cy="230" r="84.5" style={line(0.7, 1.2)} />
    </>
  );
}

/** Darkness, and a crack running through it that lets light in. */
function HopeDespair() {
  const r = rng(6);
  let x = 212;
  let d = `M${x} 0`;
  // Long segments and small turns: a fracture, not a bolt of lightning.
  for (let y = 34; y <= H + 34; y += 34) {
    x += (r() - 0.5) * 10;
    d += ` L${x.toFixed(1)} ${y}`;
  }
  return (
    <>
      <rect width={W} height={H} style={ink(0.01)} />
      <rect x="120" y="0" width="180" height={H} fill="url(#art-crack)" opacity="0.6" />
      <path d={d} style={line(0.25, 9)} filter="url(#art-blur)" />
      <path d={d} style={line(0.95, 1.2)} />
    </>
  );
}

/** Many people, as marks, receding — and one of them a little brighter. */
function HumanCondition() {
  const r = rng(7);
  const rows: ReactNode[] = [];
  let bright = '';
  for (let row = 0; row < 11; row += 1) {
    const y = 210 + row * row * 2.6 + row * 6;
    const scale = 0.35 + row * 0.11;
    const gap = 22 * scale + 6;
    let d = '';
    for (let x = (row % 2) * gap * 0.5 - 10; x < W + 10; x += gap) {
      const jitter = (r() - 0.5) * gap * 0.5;
      const h = 14 * scale + r() * 5 * scale;
      const mark = `M${n(x + jitter)} ${n(y)}v${n(-h)}`;
      // One of the crowd, a little brighter than the rest.
      if (row === 6 && Math.abs(x - 230) < gap / 2) bright = mark;
      else d += mark;
    }
    rows.push(<path key={row} d={d} style={line(0.12 + row * 0.035, 0.9 + scale * 0.6)} />);
  }
  return (
    <>
      <rect width={W} height={H} fill="url(#art-sky)" />
      {rows}
      {bright && <path d={bright} style={line(1, 1.6)} />}
    </>
  );
}

/** A single drop in still water, and the rings that thought makes. */
function PhilosophicalReflections() {
  const rings: ReactNode[] = [];
  for (let i = 1; i <= 9; i += 1) {
    rings.push(
      <ellipse
        key={i}
        cx="200"
        cy="330"
        rx={i * 24}
        ry={i * 6.2}
        style={line(0.55 - i * 0.05, 1)}
      />,
    );
  }
  return (
    <>
      <rect width={W} height={H} fill="url(#art-sky-deep)" />
      <circle cx="200" cy="120" r="12" style={ink(0.85)} />
      <circle cx="200" cy="120" r="60" fill="url(#art-glow)" opacity="0.4" />
      <line x1="0" y1="250" x2={W} y2="250" style={line(0.18)} />
      <g className="art-ripple">{rings}</g>
      <ellipse cx="200" cy="330" rx="5" ry="1.6" style={ink(0.9)} />
      {/* the moon's reflection, broken by the water */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={196 - i * 2}
          y1={380 + i * 14}
          x2={204 + i * 2}
          y2={380 + i * 14}
          style={line(0.35 - i * 0.07, 1)}
        />
      ))}
    </>
  );
}

const ART: Record<CategoryKey, () => ReactNode> = {
  LOVE_LONGING: LoveLonging,
  ABSENCE_LOSS: AbsenceLoss,
  GRIEF_MELANCHOLY: GriefMelancholy,
  EXISTENTIALISM: Existentialism,
  MORTALITY_NOTHINGNESS: MortalityNothingness,
  HOPE_DESPAIR: HopeDespair,
  HUMAN_CONDITION: HumanCondition,
  PHILOSOPHICAL_REFLECTIONS: PhilosophicalReflections,
};

/** One-line captions: what each image is of. Used as alt text when it is not decorative. */
export const ART_CAPTIONS: Record<CategoryKey, string> = {
  LOVE_LONGING: 'Two distant lights on a dark horizon',
  ABSENCE_LOSS: 'An empty, lit doorway',
  GRIEF_MELANCHOLY: 'Rain falling into still water',
  EXISTENTIALISM: 'A single small figure in a vast field',
  MORTALITY_NOTHINGNESS: 'An eclipse with dust drifting from it',
  HOPE_DESPAIR: 'A crack of light through darkness',
  HUMAN_CONDITION: 'A crowd of marks receding into the distance',
  PHILOSOPHICAL_REFLECTIONS: 'Rings spreading on dark water beneath a moon',
};

export function CategoryArt({
  category,
  className,
  decorative = true,
  crop = 'slice',
}: {
  category: CategoryKey;
  className?: string;
  /** Decorative by default: it usually sits beside the category's name. */
  decorative?: boolean;
  /** slice fills any box; meet keeps the whole composition. */
  crop?: 'slice' | 'meet';
}) {
  const Art = ART[category];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`xMidYMid ${crop}`}
      className={cn('category-art block h-full w-full', className)}
      {...(decorative
        ? { 'aria-hidden': true, focusable: false }
        : { role: 'img', 'aria-label': ART_CAPTIONS[category] })}
    >
      <rect width={W} height={H} style={{ fill: 'var(--art-ground)' }} />
      <g className="art-use">
        <Art />
      </g>
      <rect width={W} height={H} filter="url(#art-grain)" className="art-grain" />
    </svg>
  );
}
