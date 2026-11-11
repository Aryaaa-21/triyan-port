import Link from '@/lib/link';
import { CATEGORIES } from '@triyan/shared';
import { ArrowLink, SectionIntro } from '@/components/editorial';
import { CategoryPlate } from '@/components/art';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/cn';

/**
 * 04 — Archive. A library, shown as a wall of eight plates — one for each shelf
 * every writing is filed under. Staggered like an exhibition hang, not a card grid.
 */
export function ArchiveIntro() {
  return (
    <section aria-labelledby="archive-heading" className="gutter border-t border-border">
      <div className="mx-auto max-w-[90rem] py-28 lg:py-40">
        <SectionIntro index="04" label="Archive" className="mb-16" />
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal variant="blur" className="lg:col-span-7">
            <h2
              id="archive-heading"
              className="font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.95] font-light tracking-tight"
            >
              The archive
            </h2>
            <p className="mt-8 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-light text-fg-muted italic">
              everything that could not
              <br />
              remain unsaid.
            </p>
          </Reveal>
          <div className="lg:col-span-4 lg:col-start-9 lg:pb-3">
            <p className="font-reading text-lg leading-prose text-fg-muted">
              Eight shelves. Every writing is filed by what it is about, not by when it was written.
            </p>
            <div className="mt-8">
              <ArrowLink href="/writings">Enter the archive</ArrowLink>
            </div>
          </div>
        </div>

        <nav aria-label="Archive shelves" className="mt-20 lg:mt-28">
          <ol className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-4 md:gap-x-8 md:pb-20">
            {CATEGORIES.map((c, i) => (
              <Reveal
                as="li"
                key={c.key}
                stagger={i % 4}
                variant="clip"
                className={cn(
                  i % 2 === 1 && 'mt-10 md:mt-0',
                  i % 4 === 1 && 'md:mt-20',
                  i % 4 === 3 && 'md:mt-10',
                )}
              >
                <Link
                  href={`/writings?category=${c.key}`}
                  data-cursor="view"
                  className="group block no-underline"
                >
                  <CategoryPlate
                    category={c.key}
                    className="aspect-[4/5] transition-[scale] duration-1000 ease-void [&>svg]:transition-transform [&>svg]:duration-[1.6s] group-hover:[&>svg]:scale-[1.05]"
                  />
                  <span className="mt-4 flex items-baseline gap-3">
                    <span className="font-mono text-2xs text-fg-subtle tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-xl leading-tight font-light text-fg-muted transition-colors group-hover:text-fg sm:text-2xl">
                      {c.label}
                    </span>
                  </span>
                  <span className="mt-2 hidden font-reading text-sm leading-relaxed text-fg-subtle sm:block">
                    {c.description}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
