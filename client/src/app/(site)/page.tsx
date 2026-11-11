import type { Metadata } from 'next';
import Link from 'next/link';
import type { WritingDto } from '@triyan/shared';
import { fetchWritings } from '@/features/writings/api';
import { fetchAboutSafely, fetchAbyssSafely, fetchBookSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';
import { Reveal } from '@/components/ui/reveal';
import { Rule } from '@/components/ui/rule';
import { HomeOpening } from '@/features/home/opening';
import { fetchInstagramSafely } from '@/features/instagram/api';
import { PostTile } from '@/features/instagram/post-tile';

export const metadata: Metadata = {
  // Absolute: the root layout's `%s — Triyan` template would otherwise render
  // "Triyan — Poet, Writer — Triyan".
  title: { absolute: 'Triyan — Poet, Writer' },
  description:
    'The writing of Triyan — poetry on love, grief, absence, mortality and existence, in English and Hindi.',
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    // Absolute: the root layout's `%s — Triyan` template would otherwise render
    // "Triyan — Poet, Writer — Triyan".
    title: { absolute: 'Triyan — Poet, Writer' },
    description: 'An archive of everything that words cannot contain.',
  },
};

const safeWritings = async (query: Parameters<typeof fetchWritings>[0]): Promise<WritingDto[]> =>
  fetchWritings(query)
    .then((r) => r.data)
    .catch(() => []);

export default async function HomePage() {
  const [featured, recent, about, book, abyss, posts] = await Promise.all([
    safeWritings({ featured: 'true', page: '1' }),
    safeWritings({ page: '1' }),
    fetchAboutSafely(),
    fetchBookSafely(),
    fetchAbyssSafely(),
    fetchInstagramSafely({ limit: '6' }),
  ]);

  // Featured if any are marked so, otherwise simply the most recent.
  const highlight = (featured.length > 0 ? featured : recent).slice(0, 3);
  const hasWriting = recent.length > 0;

  return (
    <main id="main">
      <HomeOpening />

      {/* ------------------------------------------------------------ hero */}
      <section className="gutter mx-auto max-w-6xl pt-10 pb-24 sm:pt-20 sm:pb-32">
        <Reveal>
          <h1 className="font-display text-display leading-tight font-light tracking-tighter">
            Triyan
          </h1>
        </Reveal>
        <Reveal stagger={1}>
          <p className="mt-8 max-w-2xl font-reading text-xl leading-prose text-fg-muted">
            {about?.statement || 'An archive of everything that words cannot contain.'}
          </p>
        </Reveal>
        <Reveal stagger={2}>
          <p className="mt-6 max-w-2xl font-reading text-lg leading-prose text-fg-subtle">
            Poetry on love and its absence, on grief, mortality and existence — written in English
            and Hindi since {about?.writingSince || '2016'}.
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------------- featured */}
      {hasWriting && (
        <section className="gutter mx-auto max-w-6xl pb-24" aria-labelledby="featured-heading">
          <Rule label="Selected writing" className="mb-12" />
          <h2 id="featured-heading" className="sr-only">
            Selected writing
          </h2>

          <ul className="space-y-14">
            {highlight.map((writing, index) => (
              <Reveal as="li" key={writing.slug} stagger={index}>
                <Link href={`/writings/${writing.slug}`} className="group block no-underline">
                  <span className="font-ui text-2xs tabular-nums text-fg-subtle">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 max-w-3xl font-display text-3xl leading-snug font-light text-fg-muted transition-colors group-hover:text-fg sm:text-4xl">
                    {writing.title}
                  </h3>
                  {writing.excerpt && (
                    <p className="mt-4 max-w-prose font-reading text-base text-fg-subtle">
                      {writing.excerpt}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* -------------------------------------------------------- archive */}
      <section className="gutter mx-auto max-w-6xl py-24" aria-labelledby="archive-heading">
        <Reveal>
          <h2
            id="archive-heading"
            className="max-w-3xl font-display text-4xl leading-tight font-light tracking-tight"
          >
            {hasWriting
              ? 'Everything is kept, and everything is findable.'
              : 'The archive is being assembled.'}
          </h2>
          <p className="mt-6 max-w-prose font-reading text-lg leading-prose text-fg-muted">
            {hasWriting
              ? 'Writing is gathered by what it is about — love and longing, absence, grief, existence, mortality — rather than by the date it happened to be written.'
              : 'Nothing has been published yet. When it is, it will be gathered here by theme rather than by date.'}
          </p>
          <Link
            href="/writings"
            className="mt-10 inline-block font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-accent"
          >
            Enter the archive →
          </Link>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------- book */}
      {book?.published && (
        <section className="gutter mx-auto max-w-6xl py-24" aria-labelledby="book-heading">
          <Rule label="The book" className="mb-12" />
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <h2
                id="book-heading"
                className="font-display text-4xl leading-tight font-light tracking-tight"
              >
                {book.title}
              </h2>
              {book.salesLine && (
                <p className="mt-6 max-w-prose font-reading text-lg leading-prose text-fg-muted italic">
                  {book.salesLine}
                </p>
              )}
            </Reveal>
            <Reveal stagger={1}>
              {book.description && (
                <p className="font-reading text-lg leading-prose text-fg-muted">
                  {book.description}
                </p>
              )}
              <Link
                href="/book"
                className="mt-8 inline-block font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-accent"
              >
                About the book →
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ instagram */}
      <section className="gutter mx-auto max-w-6xl py-24" aria-labelledby="instagram-heading">
        <Rule label="From Instagram" className="mb-12" />
        <h2 id="instagram-heading" className="sr-only">
          From Instagram
        </h2>
        {posts.length > 0 ? (
          <>
            <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post._id}>
                  <PostTile post={post} />
                </li>
              ))}
            </ul>
            <Link
              href="/instagram"
              className="mt-14 inline-block font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-ember"
            >
              Every post →
            </Link>
          </>
        ) : (
          // Nothing is shown rather than placeholder tiles: a fabricated post would be
          // indistinguishable from a real one.
          <p className="max-w-prose font-reading text-lg leading-prose text-fg-subtle">
            Writing posted to Instagram will appear here once the archive is connected.
          </p>
        )}
        {about?.links.literaryInstagram && (
          <a
            href={about.links.literaryInstagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
          >
            @triyanwrites on Instagram ↗
          </a>
        )}
      </section>

      {/* ---------------------------------------------------------- abyss */}
      {abyss?.published && (
        <section className="gutter mx-auto max-w-6xl py-24" aria-labelledby="abyss-heading">
          <Rule label="Elsewhere" className="mb-12" />
          <Reveal>
            <h2
              id="abyss-heading"
              className="font-abyss text-5xl leading-none font-normal sm:text-7xl"
            >
              {abyss.name}
            </h2>
            {abyss.tagline && (
              <p className="mt-6 font-abyss-ui text-sm tracking-widest text-fg-muted uppercase">
                {abyss.tagline}
              </p>
            )}
            {abyss.philosophy && (
              <p className="mt-8 max-w-prose font-reading text-lg leading-prose text-fg-subtle">
                {abyss.philosophy}
              </p>
            )}
            <Link
              href="/abyss"
              className="mt-10 inline-block font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-ember"
            >
              Enter →
            </Link>
          </Reveal>
        </section>
      )}

      {/* -------------------------------------------------------- closing */}
      <section className="gutter mx-auto max-w-6xl py-32">
        <Reveal>
          <p className="max-w-4xl font-display text-3xl leading-snug font-light tracking-tight text-fg-muted sm:text-4xl">
            Some things are too far down to be said plainly. This is where they are kept.
          </p>
          <Link
            href="/contact"
            className="mt-12 inline-block font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
          >
            Write to Triyan →
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
