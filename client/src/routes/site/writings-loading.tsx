/** Shown while the archive is being fetched: the shape of the page, quietly breathing. */
export default function Loading() {
  return (
    <main id="main" className="gutter" aria-busy="true">
      <div className="mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
        <p className="font-display text-[clamp(3.75rem,13vw,11rem)] leading-[0.85] font-light tracking-[-0.04em] text-fg-subtle uppercase">
          Writings
        </p>
        <p className="sr-only" role="status">
          Loading the archive
        </p>
        <ul className="mt-32 border-t border-border" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="skeleton-row border-b border-border py-10">
              <span className="block h-8 bg-surface" style={{ width: `${70 - i * 9}%` }} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
