/**
 * A silhouette study of the direction ABYSS begins with: an oversized shirt, boxy
 * and dropped at the shoulder. An illustration of a shape, not a product photograph,
 * and labelled as such wherever it appears.
 */
export function ShirtSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      role="img"
      aria-label="Line drawing of an oversized, drop-shouldered shirt silhouette"
      className={className}
    >
      <defs>
        <linearGradient id="abyss-cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--art-ink)', stopOpacity: 0.1 }} />
          <stop offset="1" style={{ stopColor: 'var(--art-ink)', stopOpacity: 0.02 }} />
        </linearGradient>
      </defs>
      <path
        d="M152 70 Q200 96 248 70 L330 98 Q352 106 360 128 L388 236 L326 254 L304 186 L306 448 Q200 462 94 448 L96 186 L74 254 L12 236 L40 128 Q48 106 70 98 Z"
        fill="url(#abyss-cloth)"
        style={{ stroke: 'var(--art-ink)', strokeOpacity: 0.85, strokeWidth: 1.2 }}
      />
      {/* collar, dropped shoulder seams, hem */}
      <path
        d="M152 70 Q200 112 248 70"
        style={{ fill: 'none', stroke: 'var(--art-ink)', strokeOpacity: 0.6 }}
      />
      <path
        d="M96 186 Q92 140 70 98 M304 186 Q308 140 330 98"
        style={{
          fill: 'none',
          stroke: 'var(--art-ink)',
          strokeOpacity: 0.3,
          strokeDasharray: '3 5',
        }}
      />
      <path
        d="M96 430 Q200 444 304 430"
        style={{
          fill: 'none',
          stroke: 'var(--art-ink)',
          strokeOpacity: 0.25,
          strokeDasharray: '3 5',
        }}
      />
      {/* measuring marks: a study, not a photograph */}
      <g style={{ stroke: 'var(--art-ink)', strokeOpacity: 0.35 }}>
        <line x1="94" y1="476" x2="306" y2="476" />
        <line x1="94" y1="470" x2="94" y2="482" />
        <line x1="306" y1="470" x2="306" y2="482" />
      </g>
    </svg>
  );
}
