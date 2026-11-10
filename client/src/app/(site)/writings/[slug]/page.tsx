import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, humanizeKey, type WritingDto } from '@triyan/shared';
import { fetchRelated, fetchWriting } from '@/features/writings/api';
import { ApiError } from '@/lib/api';
import { siteName, siteUrl } from '@/lib/env';
import { Prose } from '@/components/ui/prose';
import { Rule } from '@/components/ui/rule';
import { ShareActions } from '@/features/writings/share-actions';

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

export default async function WritingPage({ params }: PageProps) {
  const { slug } = await params;
  const writing = await load(slug);
  if (!writing) notFound();

  const related = await fetchRelated(slug)
    .then((res) => res.data)
    .catch(() => []);

  const category = writing.primaryCategory ? getCategory(writing.primaryCategory) : undefined;
  const canonical = `${siteUrl}/writings/${writing.slug}`;

  /**
   * Structured data describing a real creative work. Nothing here is invented: every
   * field is taken from the stored writing, and absent values are omitted rather than
   * filled with a plausible default.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: writing.title,
    headline: writing.title,
    url: canonical,
    inLanguage: writing.language === 'HINDI' ? 'hi' : 'en',
    author: { '@type': 'Person', name: 'Triyan', url: siteUrl },
    ...(writing.publishedAt ? { datePublished: writing.publishedAt } : {}),
    dateModified: writing.updatedAt,
    ...(writing.excerpt ? { abstract: writing.excerpt } : {}),
    ...(category ? { genre: category.label } : {}),
    ...(writing.themes.length ? { keywords: writing.themes.map(humanizeKey).join(', ') } : {}),
  };

  return (
    <main id="main" className="gutter mx-auto measure-prose pt-24 pb-32 sm:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header>
          {category && (
            <Link
              href={`/writings?category=${writing.primaryCategory}`}
              className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg-muted"
            >
              {category.label}
            </Link>
          )}

          <h1 className="mt-6 font-display text-4xl leading-tight font-light tracking-tight text-fg">
            {writing.title}
          </h1>

          <p className="mt-5 font-ui text-xs text-fg-subtle">
            <span>Triyan</span>
            {writing.publishedAt && (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={writing.publishedAt}>
                  {new Date(writing.publishedAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </>
            )}
          </p>
        </header>

        <Rule className="my-12" />

        {/* The poem. Nothing animates here and nothing floats over it. */}
        <Prose language={writing.language} variant="poem">
          {writing.content}
        </Prose>
      </article>

      {(writing.themes.length > 0 || writing.emotions.length > 0) && (
        <section className="mt-16" aria-label="Themes and emotions">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {[...writing.themes, ...writing.emotions].map((key) => (
              <li key={key} className="font-ui text-2xs tracking-wide text-fg-subtle uppercase">
                {humanizeKey(key)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ShareActions title={writing.title} url={canonical} />

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="continue-reading">
          <Rule label="Continue reading" className="mb-8" />
          <h2 id="continue-reading" className="sr-only">
            Continue reading
          </h2>
          <ul className="space-y-8">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/writings/${item.slug}`} className="group block no-underline">
                  <h3 className="font-display text-2xl font-light text-fg-muted transition-colors group-hover:text-fg">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="mt-2 font-reading text-sm text-fg-subtle">{item.excerpt}</p>
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
