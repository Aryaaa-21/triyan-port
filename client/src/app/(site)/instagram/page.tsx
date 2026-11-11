import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, LANGUAGE_KEYS, type InstagramMediaDto } from '@triyan/shared';
import { fetchInstagram, type InstagramQuery } from '@/features/instagram/api';
import { PostTile } from '@/features/instagram/post-tile';
import { fetchAboutSafely } from '@/features/content/api';
import { ApiError } from '@/lib/api';
import { siteUrl } from '@/lib/env';
import { Rule } from '@/components/ui/rule';

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
  { key: '', label: 'Everything' },
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

  const href = (over: Partial<InstagramQuery>) => {
    const p = new URLSearchParams();
    const merged = { ...query, cursor: undefined, limit: undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/instagram?${s}` : '/instagram';
  };

  return (
    <main id="main" className="gutter mx-auto max-w-6xl pt-24 pb-32 sm:pt-32">
      <header className="max-w-3xl">
        <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">@triyanwrites</p>
        <h1 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-6xl">
          Visual memory
        </h1>
        <p className="mt-6 max-w-prose font-reading text-lg text-fg-muted">
          Everything posted to Instagram, kept here and sorted by what it is about. Each post links
          back to the original.
        </p>
      </header>

      <Rule className="my-10" />

      <nav aria-label="Filter by type">
        <ul className="flex flex-wrap gap-x-5 gap-y-3">
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
      <nav aria-label="Filter by category" className="mt-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-3">
          <li>
            <Filter href={href({ category: undefined })} active={!query.category}>
              All themes
            </Filter>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <Filter href={href({ category: c.key })} active={query.category === c.key}>
                {c.label}
              </Filter>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Filter by language" className="mt-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-3">
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

      <Rule className="my-10" />

      {failed ? (
        <Empty
          heading="Instagram is out of reach"
          body="The archive could not be loaded just now. Nothing is lost; try again shortly."
        />
      ) : posts.length === 0 ? (
        <Empty
          heading={
            query.category || query.language || query.productType
              ? 'Nothing in this corner'
              : 'Not connected yet'
          }
          body={
            query.category || query.language || query.productType
              ? 'No post carries that filter. Try another.'
              : 'Posts appear here once the Instagram archive has been synchronised.'
          }
          link={about?.links.literaryInstagram}
        />
      ) : (
        <>
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post._id}>
                <PostTile post={post} />
              </li>
            ))}
          </ul>
          <div className="mt-20 flex flex-wrap items-center justify-between gap-6">
            {query.cursor ? (
              <Link
                href={href({})}
                className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
              >
                ← Newest
              </Link>
            ) : (
              <span />
            )}
            {nextCursor && (
              <Link
                href={`${href({})}${href({}).includes('?') ? '&' : '?'}cursor=${encodeURIComponent(nextCursor)}`}
                className="font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-ember"
              >
                Older posts →
              </Link>
            )}
          </div>
        </>
      )}
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
      aria-current={active ? 'true' : undefined}
      className={`font-ui text-2xs tracking-widest uppercase no-underline ${active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'}`}
    >
      {children}
    </Link>
  );
}

function Empty({
  heading,
  body,
  link,
}: {
  heading: string;
  body: string;
  link?: string | undefined;
}) {
  return (
    <div className="py-16">
      <p className="font-display text-2xl font-light text-fg-muted">{heading}</p>
      <p className="mt-3 max-w-prose font-reading text-base text-fg-subtle">{body}</p>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
        >
          @triyanwrites on Instagram ↗
        </a>
      )}
    </div>
  );
}
