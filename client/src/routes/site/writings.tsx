import Link from '@/lib/link';
import { CATEGORIES, getCategory, type CategoryKey, type WritingDto } from '@triyan/shared';
import { fetchWritings, type ArchiveQuery } from '@/features/writings/api';
import { ArchiveSearch } from '@/features/writings/archive-search';
import { WritingRow } from '@/features/writings/writing-row';
import { ShelfCorner, ShelfStrip } from '@/features/writings/shelf-strip';
import { Pager } from '@/features/writings/pager';
import { InterestPopup } from '@/features/newsletter/interest-popup';
import { useMatches } from 'react-router';
import { CategoryPlate } from '@/components/art';
import { ContentPending, Label } from '@/components/editorial';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { Meta } from '@/lib/meta';

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const LANGUAGES = [
  { key: 'ENGLISH', label: 'English' },
  { key: 'HINDI', label: 'Hindi' },
  { key: 'HINGLISH', label: 'Hinglish' },
] as const;

const PAGE_SIZE = 20;

export async function loader({ request }: LoaderFunctionArgs) {
  const params: Record<string, string | undefined> = Object.fromEntries(
    new URL(request.url).searchParams,
  );
  const query: ArchiveQuery = {};
  for (const key of ['q', 'category', 'language', 'themes', 'page'] as const) {
    const value = first(params[key]);
    if (value) query[key] = value;
  }

  let writings: WritingDto[] = [];
  let total = 0;
  let totalPages = 1;
  let failed = false;
  try {
    const result = await fetchWritings({ ...query, limit: String(PAGE_SIZE) });
    writings = result.data;
    total = result.meta?.total ?? result.data.length;
    totalPages = result.meta?.totalPages ?? 1;
  } catch (error) {
    // A bad filter is the reader's typo, not a server fault: show an empty archive.
    if (!(error instanceof ApiError && error.status === 400)) failed = true;
  }
  return { query, writings, total, totalPages, failed };
}

export default function WritingsPage() {
  const { query, writings, total, totalPages, failed } = useLoaderData<typeof loader>();

  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const filtered = Boolean(query.q || query.category || query.language || query.themes);

  /** Builds a URL from the current filters with some changed. Changing a filter resets paging. */
  const href = (change: Partial<ArchiveQuery>) => {
    const next = new URLSearchParams();
    const merged = { ...query, page: undefined, ...change };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/writings?${qs}` : '/writings';
  };

  const activeCategory = query.category ? getCategory(query.category) : undefined;

  // The shell's loader knows whether the site can keep addresses at all.
  const canSubscribe = useMatches().some(
    (match) => (match.data as { newsletter?: boolean } | undefined)?.newsletter === true,
  );

  return (
    <main id="main" className="gutter">
      {canSubscribe && <InterestPopup current={activeCategory?.key} />}
      <Meta
        title="Writings"
        description="The archive: poetry and philosophical writing by Triyan, in English and Hindi, discoverable by theme, emotion and language."
        canonical="/writings"
      />
      <div className="mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
        <header className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h1 className="font-display text-[clamp(3.75rem,13vw,11rem)] leading-[0.85] font-light tracking-[-0.04em] uppercase lg:col-span-8">
            Writings
          </h1>
          <p className="max-w-sm font-reading text-lg leading-prose text-fg-muted lg:col-span-4 lg:pb-4">
            Everything published, gathered by what it is about rather than when it was written.
          </p>
        </header>

        {/* With a shelf open, every shelf moves to the right corner and stays in view. */}
        <div className={cn(activeCategory && 'lg:grid lg:grid-cols-12 lg:gap-8')}>
          <div className={cn(activeCategory && 'min-w-0 lg:col-span-9')}>
            {activeCategory && (
              <section
                aria-label={`${activeCategory.label} shelf`}
                className="mt-16 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8"
              >
                <CategoryPlate
                  category={activeCategory.key as CategoryKey}
                  className="aspect-[16/9] lg:col-span-8 lg:aspect-[21/9]"
                />
                <div className="lg:col-span-4">
                  <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase tabular-nums">
                    Shelf{' '}
                    {String(CATEGORIES.findIndex((c) => c.key === activeCategory.key) + 1).padStart(
                      2,
                      '0',
                    )}
                  </p>
                  <h2 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1] font-light tracking-tight">
                    {activeCategory.label}
                  </h2>
                  <p className="mt-5 font-display text-xl leading-snug font-light text-fg-muted italic">
                    {activeCategory.description}
                  </p>
                </div>
              </section>
            )}

            <div className={cn('mt-16', activeCategory && 'lg:hidden')}>
              <ShelfStrip active={query.category} hrefFor={(key) => href({ category: key })} />
            </div>

            <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-8">
              <div className="lg:col-span-6">
                <ArchiveSearch initialQuery={query.q ?? ''} />
              </div>
              <nav aria-label="Filter by language" className="lg:col-span-4 lg:col-start-9">
                <Label as="p">Language</Label>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                  {LANGUAGES.map((language) => (
                    <li key={language.key}>
                      <Filter
                        href={href({
                          language: query.language === language.key ? undefined : language.key,
                        })}
                        active={query.language === language.key}
                      >
                        {language.label}
                      </Filter>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="mt-20 flex items-baseline justify-between border-b border-border pb-4">
              <p
                className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
                aria-live="polite"
              >
                {failed
                  ? 'Archive unavailable'
                  : `${total} ${total === 1 ? 'writing' : 'writings'}${activeCategory ? ` · ${activeCategory.label}` : ''}${query.q ? ` · “${query.q}”` : ''}`}
              </p>
              {filtered && (
                <Link
                  href="/writings"
                  className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase no-underline hover:text-fg"
                >
                  Clear
                </Link>
              )}
            </div>

            {failed ? (
              <div className="py-24">
                <ContentPending label="Unreachable">
                  Something failed between here and the library. The writing is safe; try again in a
                  moment.
                </ContentPending>
              </div>
            ) : writings.length === 0 ? (
              <div className="py-24">
                <ContentPending label={filtered ? 'Nothing found' : 'Content to be added'}>
                  {filtered
                    ? 'Nothing in the archive matches. Try fewer words, or another shelf.'
                    : 'The archive is empty for now. Published writings will be gathered here.'}
                </ContentPending>
              </div>
            ) : (
              <ol className="archive-list">
                {writings.map((writing, i) => (
                  <li key={writing.slug}>
                    <WritingRow writing={writing} index={(page - 1) * PAGE_SIZE + i + 1} />
                  </li>
                ))}
              </ol>
            )}

            <Pager
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              hrefFor={(n) => href({ page: n > 1 ? String(n) : undefined })}
            />
          </div>
          {activeCategory && (
            <aside className="mt-16 hidden lg:col-span-3 lg:block">
              <div className="sticky top-28">
                <ShelfCorner active={query.category} hrefFor={(key) => href({ category: key })} />
              </div>
            </aside>
          )}
        </div>
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
