import Link from '@/lib/link';
import { cn } from '@/lib/cn';

/** Page numbers to show: the ends, the current page and its neighbours; 0 marks a gap. */
export const pageWindow = (page: number, totalPages: number): number[] => {
  const wanted = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: number[] = [];
  for (const p of pages) {
    const last = out.at(-1);
    if (last !== undefined && last !== 0 && p - last > 1) out.push(0);
    out.push(p);
  }
  return out;
};

/**
 * The way through the archive: how much there is, where you are, and a large, plain
 * step to the next page. Every page is also a numbered link, so the end is one click away.
 */
export function Pager({
  page,
  totalPages,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const step =
    'flex min-h-16 items-center border border-border-strong px-6 font-mono text-xs tracking-[0.2em] text-fg uppercase no-underline transition-colors duration-500 hover:border-fg hover:bg-fg hover:text-bg';

  return (
    <nav aria-label="Pages" className="mt-20">
      <p className="text-center font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase tabular-nums">
        Showing {from}–{to} of {total} writings
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} rel="prev" className={cn(step, 'justify-start')}>
            ← Previous page
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} rel="next" className={cn(step, 'justify-end')}>
            Next page · {Math.min(pageSize, total - to)} more →
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
      </div>

      <ol className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
        {pageWindow(page, totalPages).map((p, i) =>
          p === 0 ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-2 font-mono text-xs text-fg-subtle"
            >
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'flex h-11 min-w-11 items-center justify-center px-2 font-mono text-xs tabular-nums no-underline transition-colors',
                  p === page
                    ? 'border border-fg text-fg'
                    : 'border border-transparent text-fg-subtle hover:border-border-strong hover:text-fg',
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
