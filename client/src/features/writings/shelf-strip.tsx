import Link from 'next/link';
import { CATEGORIES } from '@triyan/shared';
import { CategoryPlate } from '@/components/art';
import { cn } from '@/lib/cn';

/**
 * The category filter, as shelves you can see. Eight small plates in a row on wide
 * screens; on a phone, a row you swipe — scrolled inside itself, never the page.
 */
export function ShelfStrip({
  active,
  hrefFor,
}: {
  active: string | undefined;
  hrefFor: (key: string | undefined) => string;
}) {
  return (
    <nav aria-label="Filter by category">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">Shelves</p>
        <Link
          href={hrefFor(undefined)}
          scroll={false}
          aria-current={!active ? 'true' : undefined}
          className={cn(
            'filter-link relative font-mono text-2xs tracking-[0.18em] uppercase no-underline',
            !active ? 'text-fg' : 'text-fg-subtle hover:text-fg',
          )}
        >
          All shelves
        </Link>
      </div>
      <ul className="no-scrollbar -mx-[var(--space-gutter)] mt-5 flex snap-x scroll-px-[var(--space-gutter)] gap-4 overflow-x-auto px-[var(--space-gutter)] pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-5 lg:overflow-visible lg:px-0">
        {CATEGORIES.map((c) => {
          const on = active === c.key;
          return (
            <li
              key={c.key}
              className="w-[38vw] max-w-[10rem] shrink-0 snap-start lg:w-auto lg:max-w-none"
            >
              <Link
                href={hrefFor(on ? undefined : c.key)}
                scroll={false}
                aria-current={on ? 'true' : undefined}
                data-cursor="view"
                className="group block no-underline"
              >
                <CategoryPlate
                  category={c.key}
                  className={cn(
                    'aspect-[3/4] transition-opacity duration-700',
                    active && !on ? 'opacity-35 group-hover:opacity-80' : 'opacity-100',
                  )}
                />
                <span
                  className={cn(
                    'mt-3 block font-mono text-[0.625rem] leading-snug tracking-[0.14em] uppercase transition-colors',
                    on ? 'text-fg' : 'text-fg-subtle group-hover:text-fg',
                  )}
                >
                  {c.label}
                </span>
                {on && <span aria-hidden="true" className="mt-2 block h-px bg-fg" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
