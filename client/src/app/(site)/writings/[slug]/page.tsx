import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, humanizeKey, type WritingDto } from '@triyan/shared';
import { fetchRelated, fetchWriting, fetchWritings } from '@/features/writings/api';
import { ShareActions } from '@/features/writings/share-actions';
import { Label } from '@/components/editorial';
import { CategoryArt } from '@/components/art';
import { Prose } from '@/components/ui/prose';
import { ApiError } from '@/lib/api';
import { siteName, siteUrl } from '@/lib/env';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const load = async (slug: string): Promise<WritingDto | null> => {
  try {
    return (await fetchWriting(slug)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

/** Dynamic, per-writing metadata. This is the reason the site is server-rendered. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const writing = await load(slug);
  if (!writing) return { title: 'Not found', robots: { index: false, follow: false } };

  const title = writing.seo.title || writing.title;
  const description = writing.seo.description || writing.excerpt;
  const canonical = `${siteUrl}/writings/${writing.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: writing.seo.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName,
      locale: writing.language === 'HINDI' ? 'hi_IN' : 'en_US',
      ...(writing.publishedAt ? { publishedTime: writing.publishedAt } : {}),
      ...(writing.seo.ogImage ? { images: [{ url: writing.seo.ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(writing.seo.ogImage ? { images: [writing.seo.ogImage] } : {}),
    },
  };
}

/** Neighbours in archive order (newest first). The archive is small; one page holds it. */
const neighbours = async (slug: string) => {
  const list = await fetchWritings({ limit: '60' })
    .then((r) => r.data)
    .catch(() => [] as WritingDto[]);
  const i = list.findIndex((w) => w.slug === slug);
  if (i === -1) return { previous: null, next: null };
  return { previous: list[i - 1] ?? null, next: list[i + 1] ?? null };
};

export default async function WritingPage({ params }: PageProps) {
  const { slug } = await params;
  const writing = await load(slug);
  if (!writing) notFound();

  const [related, { previous, next }] = await Promise.all([
    fetchRelated(slug)
      .then((res) => res.data)
      .catch(() => [] as WritingDto[]),
    neighbours(slug),
  ]);

  const category = writing.primaryCategory ? getCategory(writing.primaryCategory) : undefined;
  const canonical = `${siteUrl}/writings/${writing.slug}`;
  const hindi = writing.language === 'HINDI';

  /** Structured data describing a real creative work; absent values are omitted. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: writing.title,
    headline: writing.title,
    url: canonical,
    inLanguage: hindi ? 'hi' : 'en',
    author: { '@type': 'Person', name: 'Triyan', url: siteUrl },
    ...(writing.publishedAt ? { datePublished: writing.publishedAt } : {}),
    dateModified: writing.updatedAt,
    ...(writing.excerpt ? { abstract: writing.excerpt } : {}),
    ...(category ? { genre: category.label } : {}),
    ...(writing.themes.length ? { keywords: writing.themes.map(humanizeKey).join(', ') } : {}),
  };

  const date = writing.publishedAt
    ? new Date(writing.publishedAt).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main id="main" className="gutter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* The room's atmosphere: its shelf's image, faded into the page before reading starts. */}
      {writing.primaryCategory && (
        <div
          aria-hidden="true"
          className="reading-band relative mx-auto mt-6 h-[34vh] max-h-[26rem] min-h-48 max-w-[90rem] overflow-hidden"
        >
          <CategoryArt category={writing.primaryCategory} className="absolute inset-0 opacity-90" />
        </div>
      )}

      {/* The reading room. Nothing animates and nothing floats over the poem. */}
      <article
        className={`mx-auto measure-poem pb-24 ${writing.primaryCategory ? 'pt-4 sm:pt-8' : 'pt-24 sm:pt-40'}`}
      >
        <header>
          {category ? (
            <Link
              href={`/writings?category=${writing.primaryCategory}`}
              className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase no-underline hover:text-fg"
            >
              {category.label}
            </Link>
          ) : (
            <Label>Writing</Label>
          )}

          <h1
            lang={hindi ? 'hi' : undefined}
            className="mt-8 font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.05] font-light tracking-tight text-fg"
          >
            {writing.title}
          </h1>

          <p className="mt-8 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
            Triyan
            {date && (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={writing.publishedAt ?? undefined}>{date}</time>
              </>
            )}
          </p>
        </header>

        <div className="mt-24 sm:mt-32">
          <Prose language={writing.language} variant="poem" className="text-[1.1875rem]">
            {writing.content}
          </Prose>
        </div>

        <p aria-hidden="true" className="mt-24 font-display text-2xl text-fg-subtle">
          —
        </p>
      </article>

      <div className="mx-auto measure-poem space-y-14 pb-24">
        <ShareActions title={writing.title} url={canonical} />

        {(writing.themes.length > 0 || writing.emotions.length > 0) && (
          <section aria-label="Themes and emotions">
            <Label as="p">Themes</Label>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {[...new Set([...writing.themes, ...writing.emotions])].map((key) => (
                <li key={key} className="font-display text-lg font-light text-fg-muted italic">
                  {humanizeKey(key)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {(previous || next) && (
        <nav aria-label="More writing" className="mx-auto max-w-[90rem] border-t border-border">
          <div className="grid sm:grid-cols-2">
            <Neighbour writing={previous} direction="Previous" />
            <Neighbour writing={next} direction="Next" />
          </div>
        </nav>
      )}

      {related.length > 0 && (
        <section
          className="mx-auto max-w-[90rem] border-t border-border py-24"
          aria-labelledby="related-heading"
        >
          <h2
            id="related-heading"
            className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
          >
            Related writing
          </h2>
          <ul className="mt-12 grid gap-12 md:grid-cols-3">
            {related.slice(0, 3).map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/writings/${item.slug}`}
                  data-cursor="writing"
                  className="group block no-underline"
                >
                  <span className="block font-display text-2xl leading-snug font-light text-fg-muted transition-colors group-hover:text-fg">
                    {item.title}
                  </span>
                  {item.excerpt && (
                    <span className="mt-3 line-clamp-3 block font-reading text-sm leading-prose text-fg-subtle">
                      {item.excerpt}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Neighbour({
  writing,
  direction,
}: {
  writing: WritingDto | null;
  direction: 'Previous' | 'Next';
}) {
  if (!writing) return <span className="hidden sm:block" />;
  return (
    <Link
      href={`/writings/${writing.slug}`}
      data-cursor="writing"
      className={`group block border-border py-12 no-underline sm:py-16 ${
        direction === 'Next'
          ? 'sm:border-l sm:pl-10 sm:text-right'
          : 'border-b sm:border-b-0 sm:pr-10'
      }`}
    >
      <span className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        {direction === 'Previous' ? '← Previous' : 'Next →'}
      </span>
      <span className="mt-4 block font-display text-3xl leading-snug font-light text-fg-muted transition-colors group-hover:text-fg">
        {writing.title}
      </span>
    </Link>
  );
}
