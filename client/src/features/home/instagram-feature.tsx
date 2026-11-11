import type { InstagramMediaDto } from '@triyan/shared';
import { ArrowLink, ContentPending, SectionIntro } from '@/components/editorial';
import { InstagramGrid } from '@/features/instagram/instagram-grid';

/** 06 — Instagram: the living extension of the writing. It supports; it does not lead. */
export function InstagramFeature({
  posts,
  profileUrl,
}: {
  posts: InstagramMediaDto[];
  profileUrl?: string | undefined;
}) {
  return (
    <section aria-labelledby="instagram-heading" className="gutter border-t border-border">
      <div className="mx-auto max-w-[90rem] py-28 lg:py-40">
        <SectionIntro index="06" label="Instagram" className="mb-16" />
        <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="instagram-heading"
              className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-light tracking-tight"
            >
              @triyanwrites
            </h2>
            <p className="mt-4 font-display text-2xl font-light text-fg-muted italic">
              words beyond the page
            </p>
          </div>
          {posts.length > 0 && <ArrowLink href="/instagram">All work</ArrowLink>}
        </div>

        {posts.length > 0 ? (
          <InstagramGrid posts={posts} />
        ) : (
          <div className="space-y-8">
            <ContentPending label="Not yet connected">
              Posts from Instagram will gather here once the archive is connected.
            </ContentPending>
            {profileUrl && (
              <ArrowLink href={profileUrl} external tone="quiet">
                Visit @triyanwrites
              </ArrowLink>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
