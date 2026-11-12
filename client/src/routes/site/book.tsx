import Link from '@/lib/link';
import type { WritingDto } from '@triyan/shared';
import { fetchBookSafely } from '@/features/content/api';
import { fetchWriting } from '@/features/writings/api';
import { siteUrl } from '@/lib/env';
import { ArrowLink, ContentPending, Label, SectionIntro } from '@/components/editorial';
import { Prose } from '@/components/ui/prose';
import { Reveal } from '@/components/ui/reveal';
import { CategoryPlate } from '@/components/art';
import { BOOK_FUTURE, BOOK_INSPIRATION } from '@/content/triyan';
import { getCategory, type CategoryKey } from '@triyan/shared';
import { useLoaderData } from 'react-router';
import { Meta } from '@/lib/meta';

/** What the book is about, in the words of its own description. */
/** The archive shelves that share the book's subjects. */
const BOOK_SHELVES: CategoryKey[] = [
  'LOVE_LONGING',
  'ABSENCE_LOSS',
  'GRIEF_MELANCHOLY',
  'EXISTENTIALISM',
];

/** The owner's jacket artwork: the front panel leads the page, the full wrap follows. */
const BOOK_COVER = '/images/book-cover.jpg';
const BOOK_JACKET = '/images/book-jacket.jpg';

const SUBJECTS = [
  'love',
  'loss',
  'longing',
  'grief',
  'existence',
  'the complicated nature of being human',
];

/**
 * A book, not a product page. The cover leads; the reasons for the book follow;
 * then its words. Excerpts are real writings linked from the CMS, and reviews are
 * shown only when readers have given them — absence is shown as absence.
 */
export async function loader() {
  const book = await fetchBookSafely();
  const excerpts = book?.published
    ? (
        await Promise.all(
          book.excerptSlugs.map((slug) =>
            fetchWriting(slug)
              .then((r) => r.data)
              .catch(() => null),
          ),
        )
      ).filter((w): w is WritingDto => w !== null)
    : [];
  return { book, excerpts };
}

export default function BookPage() {
  const { book, excerpts } = useLoaderData<typeof loader>();

  if (!book?.published) {
    return (
      <main id="main" className="gutter">
        <Meta
          title="Leaving and Living"
          description="Leaving and Living — a collection of poetry by Triyan exploring love, loss, longing, grief, existence, and the complicated nature of being human."
          canonical="/book"
          type="book"
        />
        <div className="mx-auto max-w-[90rem] pt-24 pb-32">
          <h1 className="font-display text-[clamp(3rem,9vw,8rem)] leading-[0.9] font-light tracking-tight">
            The book
          </h1>
          <ContentPending className="mt-16">Details of the book will be added here.</ContentPending>
        </div>
      </main>
    );
  }

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

  const facts = [
    book.publisher && ['Publisher', book.publisher],
    book.publicationDate && ['Published', new Date(book.publicationDate).getFullYear().toString()],
    book.formats.length > 0 && ['Formats', book.formats.join(', ')],
    book.isbn && ['ISBN', book.isbn],
  ].filter(Boolean) as [string, string][];

  return (
    <main id="main" className="gutter">
      <Meta
        title="Leaving and Living"
        description="Leaving and Living — a collection of poetry by Triyan exploring love, loss, longing, grief, existence, and the complicated nature of being human."
        canonical="/book"
        type="book"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
        {/* ------------------------------------------------------------ hero */}
        <section className="grid gap-16 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-5">
            {book.coverImageUrl ? (
              <Reveal variant="clip">
                {/* The cover is owner-supplied and may live on any host. */}
                <img
                  src={book.coverImageUrl}
                  alt={`Front cover of ${book.title}`}
                  className="mx-auto w-full max-w-md shadow-[var(--shadow-overlay)]"
                />
              </Reveal>
            ) : (
              <div
                role="img"
                aria-label={`The cover of ${book.title} has not been added yet`}
                className="portrait-void mx-auto flex aspect-[2/3] w-full max-w-md flex-col justify-between border border-border p-8"
              >
                <Label>Cover to be added</Label>
                <span className="font-display text-3xl leading-tight font-light text-fg-subtle">
                  {book.title}
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Label as="p">A poetry collection · Triyan</Label>
            <h1 className="mt-8 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-light tracking-tight">
              Leaving
              <br />
              <span className="text-fg-muted italic">and</span> Living
            </h1>
            {book.description && (
              <p className="mt-10 max-w-lg font-reading text-xl leading-prose text-fg-muted">
                {book.description}
              </p>
            )}
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-2">
              <ArrowLink href="#excerpts">Read</ArrowLink>
              {book.purchaseUrl ? (
                <ArrowLink href={book.purchaseUrl} external>
                  Buy
                </ArrowLink>
              ) : (
                <span className="py-2 font-mono text-xs tracking-[0.2em] text-fg-subtle uppercase">
                  Availability to be announced
                </span>
              )}
            </div>
            {facts.length > 0 && (
              <dl className="mt-14 grid max-w-md grid-cols-[7rem_1fr] gap-x-6 gap-y-3 border-t border-border pt-6">
                {facts.map(([k, v]) => (
                  <div key={k} className="contents">
                    <Label as="dt">{k}</Label>
                    <dd className="font-reading text-base text-fg-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------- jacket */}
        {book.coverImageUrl === BOOK_COVER && (
          <section aria-labelledby="jacket-heading" className="mt-32 lg:mt-44">
            <SectionIntro label="The jacket" className="mb-12" />
            <h2 id="jacket-heading" className="sr-only">
              The jacket
            </h2>
            <Reveal variant="clip">
              <img
                src={BOOK_JACKET}
                alt={`The full jacket of ${book.title}: back cover with the publisher's description, spine, and front cover`}
                width={1540}
                height={1200}
                loading="lazy"
                decoding="async"
                className="mx-auto h-auto w-full max-w-5xl shadow-[var(--shadow-overlay)]"
              />
            </Reveal>
          </section>
        )}

        {/* ------------------------------------------------------------- why */}
        <section aria-labelledby="why-heading" className="mt-40 lg:mt-56">
          <SectionIntro label="Why this book exists" className="mb-16" />
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
            <h2 id="why-heading" className="sr-only">
              Why this book exists
            </h2>
            <Reveal variant="blur" className="lg:col-span-7">
              <ul className="font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.05] font-light tracking-tight">
                {SUBJECTS.map((subject, i) => (
                  <li
                    key={subject}
                    className={i === SUBJECTS.length - 1 ? 'mt-3 text-fg-muted italic' : 'text-fg'}
                  >
                    {subject}
                    {i < SUBJECTS.length - 2 ? ',' : i === SUBJECTS.length - 2 ? ' —' : '.'}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="space-y-12 lg:col-span-4 lg:col-start-9 lg:pt-4">
              <div>
                <Label as="p">Inspiration</Label>
                <p className="mt-4 font-reading text-lg leading-prose text-fg-muted">
                  {BOOK_INSPIRATION}
                </p>
              </div>
              {book.audience && (
                <div>
                  <Label as="p">Written for</Label>
                  <p className="mt-4 font-reading text-lg leading-prose text-fg-muted">
                    {book.audience}
                  </p>
                </div>
              )}
              {book.salesLine && (
                <blockquote className="border-l border-border-strong pl-6 font-display text-2xl leading-snug font-light text-fg italic">
                  {book.salesLine}
                </blockquote>
              )}
            </div>
          </div>

          {/* The shelves of the archive this book shares its subjects with. */}
          <nav aria-label="Related shelves" className="mt-20">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
              {BOOK_SHELVES.map((key) => (
                <li key={key}>
                  <Link
                    href={`/writings?category=${key}`}
                    data-cursor="view"
                    className="group block no-underline"
                  >
                    <CategoryPlate category={key} className="aspect-[4/3]" />
                    <span className="mt-3 block font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase transition-colors group-hover:text-fg">
                      {getCategory(key)?.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* -------------------------------------------------------- excerpts */}
        <section
          id="excerpts"
          aria-labelledby="excerpts-heading"
          className="mt-40 scroll-mt-24 lg:mt-56"
        >
          <SectionIntro label="Excerpts" className="mb-16" />
          <h2 id="excerpts-heading" className="sr-only">
            Excerpts
          </h2>
          {excerpts.length > 0 ? (
            <ul className="space-y-32">
              {excerpts.map((w) => (
                <li key={w.slug} className="mx-auto measure-poem">
                  <p className="font-display text-3xl font-light">{w.title}</p>
                  <Prose language={w.language} variant="poem" className="mt-10">
                    {w.content}
                  </Prose>
                  <div className="mt-10">
                    <ArrowLink href={`/writings/${w.slug}`} tone="quiet">
                      Read on its own page
                    </ArrowLink>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="lg:ml-[33%]">
              <ContentPending>
                Selected passages from the book will be set here. Until then, the{' '}
                <Link href="/writings" className="underline">
                  archive
                </Link>{' '}
                holds the published writing.
              </ContentPending>
            </div>
          )}
        </section>

        {/* --------------------------------------------------------- reviews */}
        <section aria-labelledby="reviews-heading" className="mt-28 lg:mt-36">
          <SectionIntro label="Readers" className="mb-16" />
          <h2 id="reviews-heading" className="sr-only">
            Reader reviews
          </h2>
          {book.reviews.length > 0 ? (
            <ul className="grid gap-16 md:grid-cols-2">
              {book.reviews.map((review, index) => (
                <li key={index}>
                  <blockquote className="font-display text-3xl leading-snug font-light">
                    “{review.quote}”
                  </blockquote>
                  {review.attribution && (
                    <Label as="p" className="mt-6">
                      {review.attribution}
                      {review.source ? ` · ${review.source}` : ''}
                    </Label>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="lg:ml-[33%]">
              <ContentPending label="No reviews yet">
                What readers say about the book will be gathered here, once they have said it.
              </ContentPending>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- end */}
        <section className="mt-40 grid gap-12 border-t border-border pt-20 lg:mt-56 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Label as="p">What comes next</Label>
            <p className="mt-8 font-display text-[clamp(2rem,4vw,3.25rem)] leading-tight font-light">
              {BOOK_FUTURE}
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-14">
            {book.purchaseUrl ? (
              <ArrowLink href={book.purchaseUrl} external>
                Buy the book
              </ArrowLink>
            ) : (
              <ContentPending label="Availability">
                Publishing and distribution details will be announced here.
              </ContentPending>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
