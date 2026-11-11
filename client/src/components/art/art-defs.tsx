/**
 * Shared SVG definitions for the category artwork: gradients, the soft blur and the
 * film grain. Rendered once in the site shell. Not `display: none` — browsers do not
 * resolve paint servers inside an undisplayed SVG — but sized to nothing.
 */
export function ArtDefs() {
  const stop = (offset: string, opacity: number) => (
    <stop offset={offset} style={{ stopColor: 'var(--art-ink)', stopOpacity: opacity }} />
  );
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="pointer-events-none absolute"
    >
      <defs>
        <linearGradient id="art-sky" x1="0" y1="0" x2="0" y2="1">
          {stop('0', 0.0)}
          {stop('0.75', 0.07)}
          {stop('1', 0.02)}
        </linearGradient>
        <linearGradient id="art-sky-deep" x1="0" y1="0" x2="0" y2="1">
          {stop('0', 0.0)}
          {stop('0.8', 0.11)}
          {stop('1', 0.03)}
        </linearGradient>
        <radialGradient id="art-glow">
          {stop('0', 0.55)}
          {stop('0.25', 0.18)}
          {stop('1', 0)}
        </radialGradient>
        <radialGradient id="art-corona">
          {stop('0.5', 0)}
          {stop('0.56', 0.75)}
          {stop('0.64', 0.2)}
          {stop('1', 0)}
        </radialGradient>
        <linearGradient id="art-door" x1="0" y1="0" x2="0" y2="1">
          {stop('0', 0.28)}
          {stop('1', 0.62)}
        </linearGradient>
        <linearGradient id="art-spill" x1="0" y1="0" x2="0" y2="1">
          {stop('0', 0.3)}
          {stop('1', 0)}
        </linearGradient>
        <linearGradient id="art-crack" x1="0" y1="0" x2="1" y2="0">
          {stop('0', 0)}
          {stop('0.5', 0.22)}
          {stop('1', 0)}
        </linearGradient>
        <filter id="art-blur" x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="art-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}
