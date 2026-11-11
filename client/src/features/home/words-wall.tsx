import Link from '@/lib/link';
import { getCategory, type WritingDto } from '@triyan/shared';
import { ArrowLink, ContentPending, SectionIntro } from '@/components/editorial';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/cn';
import { CategoryArt } from '@/components/art';
import { WORKING_TITLES } from '@/content/triyan';

/** Alternating offsets give the wall its asymmetry; titles are objects, not rows. */
const OFFSETS = ['', 'lg:ml-[18%]', 'lg:ml-[6%]', 'lg:ml-[26%]', 'lg:ml-[12%]', 'lg:ml-[22%]'];

/**
 * 03 — Words. The reason the site exists, set as a literary wall. Hovering or
 * focusing a title brings it forward and quiets the rest; the category, date and a
 * line of the writing surface beside it. Nothing here depends on hover: on touch
 * the metadata is always visible and the title is the link.
 */
export function WordsWall({ writings }: { writings: WritingDto[] }) {
  return (
    <section aria-labelledby="words-heading" className="gutter">
      <div className="mx-auto max-w-[90rem] py-28 lg:py-40">
        <SectionIntro index="03" label="Words" className="mb-16" />
        <h2 id="words-heading" className="sr-only">
          Words
        </h2>

        {writings.length === 0 ? (
          <WorkingTitles />
        ) : (
          <div className="words-wall grid gap-8 lg:grid-cols-12">
            <ul className="space-y-12 sm:space-y-16 lg:col-span-8">
              {writings.map((writing, i) => {
                const category = writing.primaryCategory
                  ? getCategory(writing.primaryCategory)
                  : null;
                const year = writing.publishedAt
                  ? new Date(writing.publishedAt).getFullYear()
                  : null;
                return (
                  <Reveal
                    as="li"
                    key={writing.slug}
                    stagger={i % 3}
                    className={cn('max-w-4xl', OFFSETS[i % OFFSETS.length])}
                  >
                    <Link
                      href={`/writings/${writing.slug}`}
                      data-cursor="writing"
                      data-category={writing.primaryCategory ?? undefined}
                      className="word group block no-underline"
                    >
                      <span className="flex items-baseline gap-4 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
                        <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                        {category && <span>{category.label}</span>}
                        {year && <span className="tabular-nums">{year}</span>}
                      </span>
                      <span
                        lang={writing.language === 'HINDI' ? 'hi' : undefined}
                        className="mt-3 block font-display text-[clamp(2.25rem,6vw,5rem)] leading-[1.02] font-light tracking-tight text-balance text-fg transition-[translate,color] duration-700 ease-void group-hover:translate-x-3 group-focus-visible:translate-x-3"
                      >
                        {writing.title}
                      </span>
                      {writing.excerpt && (
                        <span className="word-excerpt mt-4 block max-w-xl font-reading text-base leading-prose text-fg-muted">
                          {writing.excerpt}
                        </span>
                      )}
                    </Link>
                  </Reveal>
                );
              })}
            </ul>

            {/*
            The wall's atmosphere: the hovered writing's shelf appears beside it. Desktop
            only, decorative, and driven entirely by CSS (see .wall-art in globals.css).
          */}
            <div aria-hidden="true" className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-28 aspect-[4/5] w-full">
                {[...new Set(writings.map((w) => w.primaryCategory).filter((c) => c !== null))].map(
                  (category, i) => (
                    <div
                      key={category}
                      data-category={category}
                      data-default={i === 0 ? '' : undefined}
                      className="wall-art absolute inset-0"
                    >
                      <CategoryArt category={category} />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {writings.length > 0 && (
          <div className="mt-20 lg:ml-[22%]">
            <ArrowLink href="/writings">Every writing</ArrowLink>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Until the first writing is published, the wall holds Triyan's own favourites as
 * working titles: set as type, not links, and labelled as provisional — they are
 * "not necessarily final published titles", in his words.
 */
function WorkingTitles() {
  return (
    <div>
      <ul className="space-y-6 sm:space-y-8">
        {WORKING_TITLES.map((title, i) => (
          <Reveal
            as="li"
            key={title}
            stagger={i % 3}
            className={cn('max-w-4xl', OFFSETS[i % OFFSETS.length])}
          >
            <span className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="mt-2 font-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[1.04] font-light tracking-tight text-balance text-fg-muted">
              {title}
            </p>
          </Reveal>
        ))}
      </ul>
      <ContentPending label="Working titles" className="mt-20 lg:ml-[22%]">
        Pieces Triyan has chosen as favourites. Their full texts arrive with the archive.
      </ContentPending>
    </div>
  );
}
