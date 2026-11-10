import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, LANGUAGE_KEYS, type WritingDto } from '@triyan/shared';
import { fetchWritings, type ArchiveQuery } from '@/features/writings/api';
import { ApiError } from '@/lib/api';
import { siteUrl } from '@/lib/env';
import { Rule } from '@/components/ui/rule';
import { ArchiveSearch } from '@/features/writings/archive-search';

export const metadata: Metadata = {
  title: 'Writings',
  description:
    'The archive: poetry and philosophical writing by Triyan, in English and Hindi, discoverable by theme, emotion and language.',
  alternates: { canonical: `${siteUrl}/writings` },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function WritingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query: ArchiveQuery = {
    ...(first(params.q) ? { q: first(params.q) } : {}),
    ...(first(params.category) ? { category: first(params.category) } : {}),
    ...(first(params.language) ? { language: first(params.language) } : {}),
    ...(first(params.themes) ? { themes: first(params.themes) } : {}),
    ...(first(params.page) ? { page: first(params.page) } : {}),
  };

  let writings: WritingDto[] = [];
  let total = 0;
  let failed = false;

  try {
    const result = await fetchWritings(query);
    writings = result.data;
    total = result.meta?.total ?? result.data.length;
  } catch (error) {
    // A bad filter is the reader's typo, not a server fault: show an empty archive.
    if (!(error instanceof ApiError && error.status === 400)) failed = true;
  }

  const activeCategory = query.category;
  const activeLanguage = query.language;

  return (
    <main id="main" className="gutter mx-auto max-w-5xl pt-24 pb-32 sm:pt-32">
      <header>
        <h1 className="font-display text-4xl font-light tracking-tight">The Archive</h1>
        <p className="mt-4 max-w-prose font-reading text-lg text-fg-muted">
          Everything published, discoverable by what it is about rather than when it was written.
        </p>
      </header>

      <Rule className="my-10" />

      <ArchiveSearch initialQuery={query.q ?? ''} />

      <nav aria-label="Filter by category" className="mt-8">
        <ul className="flex flex-wrap gap-x-5 gap-y-3">
          <li>
            <FilterLink href="/writings" active={!activeCategory}>
              All
            </FilterLink>
          </li>
          {CATEGORIES.map((category) => (
            <li key={category.key}>
              <FilterLink
                href={`/writings?category=${category.key}`}
                active={activeCategory === category.key}
              >
                {category.label}
              </FilterLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Filter by language" className="mt-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-3">
          {LANGUAGE_KEYS.filter((l) => l !== 'UNKNOWN').map((language) => (
            <li key={language}>
              <FilterLink
                href={`/writings?language=${language}`}
                active={activeLanguage === language}
              >
                {language.charAt(0) + language.slice(1).toLowerCase()}
              </FilterLink>
            </li>
          ))}
        </ul>
      </nav>

      <Rule className="my-10" />

      {failed ? (
        <EmptyState
          heading="The archive is unreachable"
          body="Something failed between here and the library. The writing is safe; try again in a moment."
        />
      ) : writings.length === 0 ? (
        <EmptyState
          heading={query.q ? 'Nothing matches those words' : 'Nothing here yet'}
          body={
            query.q
              ? 'Try fewer words, or browse by theme instead.'
              : 'The archive is empty. Published writings will appear here.'
          }
        />
      ) : (
        <>
          <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
            {total} {total === 1 ? 'writing' : 'writings'}
          </p>
          <ul className="mt-10 space-y-12">
            {writings.map((writing) => (
              <li key={writing.slug}>
                <Link href={`/writings/${writing.slug}`} className="group block no-underline">
                  <h2 className="font-display text-3xl leading-snug font-light text-fg-muted transition-colors group-hover:text-fg">
                    {writing.title}
                  </h2>
                  {writing.excerpt && (
                    <p className="mt-3 max-w-prose font-reading text-base text-fg-subtle">
                      {writing.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`font-ui text-xs tracking-wide no-underline transition-colors ${
        active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyState({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="py-20">
      <p className="font-display text-2xl font-light text-fg-muted">{heading}</p>
      <p className="mt-3 max-w-prose font-reading text-fg-subtle">{body}</p>
    </div>
  );
}
