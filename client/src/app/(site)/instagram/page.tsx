import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, LANGUAGE_KEYS, type InstagramMediaDto } from '@triyan/shared';
import { fetchInstagram, type InstagramQuery } from '@/features/instagram/api';
import { InstagramGrid } from '@/features/instagram/instagram-grid';
import { ArrowLink, ContentPending, Label, SectionIntro } from '@/components/editorial';
import { cn } from '@/lib/cn';
import { fetchAboutSafely } from '@/features/content/api';
import { ApiError } from '@/lib/api';
import { siteUrl } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Instagram',
  description:
    'Every post from @triyanwrites, sorted by what it is about — love, grief, absence, existence — in English and Hindi.',
  alternates: { canonical: `${siteUrl}/instagram` },
  openGraph: { title: 'Instagram — Triyan', url: `${siteUrl}/instagram` },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const TYPES = [
  { key: '', label: 'All' },
  { key: 'FEED', label: 'Posts' },
  { key: 'REELS', label: 'Reels' },
] as const;

export default async function InstagramPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query: InstagramQuery = {
    limit: '24',
    ...(first(params.category) ? { category: first(params.category) } : {}),
    ...(first(params.language) ? { language: first(params.language) } : {}),
    ...(first(params.productType) ? { productType: first(params.productType) } : {}),
    ...(first(params.cursor) ? { cursor: first(params.cursor) } : {}),
  };

  let posts: InstagramMediaDto[] = [];
  let nextCursor: string | null = null;
  let failed = false;
  try {
    const res = await fetchInstagram(query);
    posts = res.data;
    nextCursor = res.meta?.nextCursor ?? null;
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 400)) failed = true;
  }
  const about = await fetchAboutSafely();
  // Curated first (Q24): posts Triyan has featured lead the unfiltered first page.
  const unfiltered = !query.category && !query.language && !query.productType && !query.cursor;
  const selected = unfiltered
    ? await fetchInstagram({ featured: 'true', limit: '6' })
        .then((r) => r.data)
        .catch(() => [] as InstagramMediaDto[])
    : [];

  const href = (over: Partial<InstagramQuery>) => {
    const p = new URLSearchParams();
    const merged = { ...query, cursor: undefined, limit: undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/instagram?${s}` : '/instagram';
  };

  const filtered = Boolean(query.category || query.language || query.productType);

  return (
    <main id="main" className="gutter">
      <div className="mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
        <header className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <Label as="p">Triyan Writes</Label>
            <h1 className="mt-8 font-display text-[clamp(3rem,10vw,9rem)] leading-[0.88] font-light tracking-[-0.03em]">
              @triyanwrites
            </h1>
          </div>
          <p className="font-display text-[clamp(1.5rem,2.5vw,2.25rem)] leading-tight font-light text-fg-muted italic lg:col-span-4 lg:pb-3">
            words beyond the page
          </p>
        </header>

        <div className="mt-20 grid gap-8 border-y border-border py-8 lg:grid-cols-12 lg:gap-8">
          <nav aria-label="Filter by type" className="lg:col-span-3">
            <Label as="p">Form</Label>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {TYPES.map((t) => (
                <li key={t.key || 'all'}>
                  <Filter
                    href={href({ productType: t.key || undefined })}
                    active={(query.productType ?? '') === t.key}
                  >
                    {t.label}
                  </Filter>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Filter by category" className="lg:col-span-6">
            <Label as="p">Category</Label>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              <li>
                <Filter href={href({ category: undefined })} active={!query.category}>
                  All
                </Filter>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.key}>
                  <Filter
                    href={href({ category: query.category === c.key ? undefined : c.key })}
                    active={query.category === c.key}
                  >
                    {c.label}
                  </Filter>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Filter by language" className="lg:col-span-3">
            <Label as="p">Language</Label>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {LANGUAGE_KEYS.filter((l) => l !== 'UNKNOWN').map((l) => (
                <li key={l}>
                  <Filter
                    href={href({ language: query.language === l ? undefined : l })}
                    active={query.language === l}
                  >
                    {l.charAt(0) + l.slice(1).toLowerCase()}
                  </Filter>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {selected.length > 0 && (
          <section aria-labelledby="selected-heading" className="mt-20">
            <h2 id="selected-heading" className="sr-only">
              Selected
            </h2>
            <SectionIntro label="Selected" className="mb-14" />
            <InstagramGrid posts={selected} />
          </section>
        )}

        <SectionIntro
          label={query.cursor ? 'All work · earlier' : 'All work'}
          className="mt-20 mb-14"
        />

        {failed ? (
          <ContentPending label="Out of reach">
            The archive could not be loaded just now. Nothing is lost; try again shortly.
          </ContentPending>
        ) : posts.length === 0 ? (
          <div className="space-y-8">
            <ContentPending label={filtered ? 'Nothing in this corner' : 'Not yet connected'}>
              {filtered
                ? 'No post carries that filter. Try another.'
                : 'Posts will gather here once the Instagram archive has been connected.'}
            </ContentPending>
            {!filtered && about?.links.literaryInstagram && (
              <ArrowLink href={about.links.literaryInstagram} external tone="quiet">
                Visit @triyanwrites
              </ArrowLink>
            )}
          </div>
        ) : (
          <>
            <InstagramGrid posts={posts} />
            <nav
              aria-label="Pages"
              className="mt-24 flex items-center justify-between border-t border-border pt-8"
            >
              {query.cursor ? (
                <Link
                  href={href({})}
                  className="font-mono text-xs tracking-[0.2em] text-fg-subtle uppercase no-underline hover:text-fg"
                >
                  ← Newest
                </Link>
              ) : (
                <span />
              )}
              {nextCursor && (
                <Link
                  href={`${href({})}${href({}).includes('?') ? '&' : '?'}cursor=${encodeURIComponent(nextCursor)}`}
                  className="font-mono text-xs tracking-[0.2em] text-fg uppercase no-underline hover:text-accent"
                >
                  Older posts →
                </Link>
              )}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}

function Filter({
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
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'filter-link relative font-mono text-2xs tracking-[0.18em] uppercase no-underline transition-colors duration-500',
        active ? 'text-fg' : 'text-fg-subtle hover:text-fg',
      )}
    >
      {children}
    </Link>
  );
}
