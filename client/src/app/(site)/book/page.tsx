import type { Metadata } from 'next';
import { fetchBookSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';
import { Rule } from '@/components/ui/rule';

export const metadata: Metadata = {
  title: 'Leaving and Living',
  description:
    'Leaving and Living — a collection of poetry by Triyan exploring love, loss, longing, grief, existence, and the complicated nature of being human.',
  alternates: { canonical: `${siteUrl}/book` },
  openGraph: { type: 'book', url: `${siteUrl}/book`, title: 'Leaving and Living' },
};

export default async function BookPage() {
  const book = await fetchBookSafely();

  if (!book?.published) {
    return (
      <main id="main" className="gutter mx-auto measure-prose pt-20 pb-32">
        <h1 className="font-display text-4xl font-light tracking-tight">The book</h1>
        <p className="mt-6 font-reading text-lg text-fg-subtle">Details are not published yet.</p>
      </main>
    );
  }

  /**
   * Book structured data carries only confirmed fields. isbn, datePublished,
   * publisher, price and reviews are omitted entirely when empty — an absent field
   * is honest, a guessed one is not.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: 'Triyan', url: siteUrl },
    url: `${siteUrl}/book`,
    ...(book.description ? { description: book.description } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publisher ? { publisher: { '@type': 'Organization', name: book.publisher } } : {}),
    ...(book.publicationDate ? { datePublished: book.publicationDate } : {}),
    ...(book.coverImageUrl ? { image: book.coverImageUrl } : {}),
  };

  return (
    <main id="main" className="gutter mx-auto max-w-5xl pt-20 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-14 lg:grid-cols-[320px_1fr]">
        <div>
          {book.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               the cover URL is owner-supplied and may point at any host, which
               next/image cannot optimise without that host allow-listed at build
               time. Revisit once the cover is uploaded to our own media store. */
            <img
              src={book.coverImageUrl}
              alt={`Front cover of ${book.title}`}
              className="w-full border border-border"
            />
          ) : (
            <div
              className="flex aspect-[2/3] w-full items-center justify-center border border-border bg-surface"
              role="img"
              aria-label={`No cover image has been supplied for ${book.title}`}
            >
              <p className="gutter text-center font-display text-xl leading-snug font-light text-fg-subtle">
                {book.title}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">A collection</p>
          <h1 className="mt-5 font-display text-5xl leading-tight font-light tracking-tight">
            {book.title}
          </h1>

          {book.salesLine && (
            <p className="mt-8 max-w-prose font-reading text-lg leading-prose text-fg-muted italic">
              {book.salesLine}
            </p>
          )}

          <Rule className="my-10" />

          {book.description && (
            <p className="max-w-prose font-reading text-lg leading-prose text-fg-muted">
              {book.description}
            </p>
          )}

          {book.audience && (
            <>
              <h2 className="mt-12 font-ui text-2xs tracking-widest text-fg-subtle uppercase">
                Written for
              </h2>
              <p className="mt-4 max-w-prose font-reading text-base leading-prose text-fg-muted">
                {book.audience}
              </p>
            </>
          )}

          {book.purchaseUrl && (
            <a
              href={book.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-flex items-center rounded-sm bg-fg px-7 py-3.5 font-ui text-sm tracking-wide text-bg uppercase no-underline transition-colors hover:bg-accent"
            >
              Buy the book ↗
            </a>
          )}

          {book.reviews.length > 0 && (
            <section className="mt-20" aria-labelledby="reviews-heading">
              <Rule label="Readers" className="mb-8" />
              <h2 id="reviews-heading" className="sr-only">
                Reader reviews
              </h2>
              <ul className="space-y-8">
                {book.reviews.map((review, index) => (
                  <li key={index}>
                    <blockquote className="max-w-prose font-reading text-lg leading-prose text-fg-muted">
                      “{review.quote}”
                    </blockquote>
                    {review.attribution && (
                      <p className="mt-2 font-ui text-2xs tracking-widest text-fg-subtle uppercase">
                        {review.attribution}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
