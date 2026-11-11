import Image from '@/lib/image';
import type { BookDto } from '@triyan/shared';
import { ArrowLink, SectionIntro } from '@/components/editorial';
import { Reveal } from '@/components/ui/reveal';

/**
 * 05 — Leaving and Living. The cover when it exists. Until then the title itself is
 * the object — set large, with no frame, so it can never be mistaken for a cover.
 */
export function BookFeature({ book }: { book: BookDto | null }) {
  if (!book?.published) return null;
  return (
    <section aria-labelledby="book-heading" className="gutter border-t border-border">
      <div className="mx-auto max-w-[90rem] py-28 lg:py-40">
        <SectionIntro index="05" label="The book" className="mb-16" />
        <div className="grid items-end gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            {book.coverImageUrl ? (
              <Reveal variant="clip">
                <div className="relative aspect-[2/3] w-full max-w-md bg-surface">
                  <Image
                    src={book.coverImageUrl}
                    alt={`Front cover of ${book.title}`}
                    fill
                    sizes="(min-width: 1024px) 30vw, 80vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </Reveal>
            ) : (
              <Reveal variant="blur">
                <h2
                  id="book-heading"
                  className="font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.88] font-light tracking-tight"
                >
                  Leaving
                  <br />
                  <span className="pl-[0.6em] text-fg-muted italic">and</span>
                  <br />
                  Living
                </h2>
              </Reveal>
            )}
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            {book.coverImageUrl && (
              <h2
                id="book-heading"
                className="font-display text-5xl leading-tight font-light tracking-tight"
              >
                {book.title}
              </h2>
            )}
            <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
              A poetry collection
            </p>
            {book.salesLine && (
              <p className="mt-8 font-display text-2xl leading-snug font-light text-fg-muted italic">
                {book.salesLine}
              </p>
            )}
            {book.description && (
              <p className="mt-8 font-reading text-lg leading-prose text-fg-muted">
                {book.description}
              </p>
            )}
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-2">
              <ArrowLink href="/book">Explore the book</ArrowLink>
              {book.purchaseUrl ? (
                <ArrowLink href={book.purchaseUrl} external tone="quiet">
                  Buy
                </ArrowLink>
              ) : (
                <span className="py-2 font-mono text-xs tracking-[0.2em] text-fg-subtle uppercase">
                  Availability to be announced
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
