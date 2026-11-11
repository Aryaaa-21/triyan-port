/** While a writing loads: the quiet of the reading room, not the archive's heading. */
export default function Loading() {
  return (
    <main id="main" className="gutter" aria-busy="true">
      <p className="sr-only" role="status">
        Loading the writing
      </p>
      <div aria-hidden="true" className="mx-auto measure-poem pt-40 pb-32">
        <span className="skeleton-row block">
          <span className="block h-3 w-24 bg-surface" />
        </span>
        <span className="skeleton-row mt-8 block">
          <span className="block h-12 w-4/5 bg-surface" />
        </span>
        <span className="skeleton-row mt-24 block space-y-4">
          {[88, 72, 80, 40].map((w) => (
            <span key={w} className="block h-4 bg-surface" style={{ width: `${w}%` }} />
          ))}
        </span>
      </div>
    </main>
  );
}
