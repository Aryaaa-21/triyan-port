import Image from '@/lib/image';
import { BackLink } from '@/components/site/back-link';
import Link from '@/lib/link';
import { getCategory, humanizeKey, type InstagramMediaDto } from '@triyan/shared';
import {
  archiveSlides,
  fetchInstagramItem,
  isArchivePost,
  postImage,
  postKind,
  postTitle,
} from '@/features/instagram/api';
import { PostTile } from '@/features/instagram/instagram-grid';
import { Label } from '@/components/editorial';
import { ApiError } from '@/lib/api';
import { Prose } from '@/components/ui/prose';
import { InSimpleWords } from '@/features/writings/in-simple-words';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { Meta as PageMeta } from '@/lib/meta';

const load = async (id: string) => {
  try {
    const res = await fetchInstagramItem(id);
    return { post: res.data, related: res.meta?.related ?? [] };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export async function loader({ params }: LoaderFunctionArgs) {
  const found = await load(params.id ?? '');
  if (!found) throw new Response('Not found', { status: 404 });
  return found;
}

export default function InstagramPostPage() {
  const { post, related } = useLoaderData<typeof loader>();
  const c = post.classification;
  const category = c.primaryCategory ? getCategory(c.primaryCategory) : undefined;
  const title = postTitle(post);
  const description = post.caption.replace(/\s+/g, ' ').trim().slice(0, 160) || title;
  const image = postImage(post);

  return (
    <main id="main" className="gutter mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
      <PageMeta
        title={title}
        description={description}
        canonical={`/instagram/${post._id}`}
        type="article"
        {...(image ? { image } : {})}
      />
      <BackLink href="/instagram">Back to visual memory</BackLink>

      <article className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          {isArchivePost(post) ? (
            <ArchiveMedia post={post} title={title} />
          ) : (
            <Media post={post} title={title} />
          )}
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
            {postKind(post)} ·{' '}
            <time dateTime={post.timestamp}>
              {new Date(post.timestamp).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </p>
          {post.text ? (
            <>
              {/* The first line is already the piece's opening; the heading is for outlines. */}
              <h1 className="sr-only">{title}</h1>
              <Writing text={post.text} language={c.language} timestamp={post.timestamp} />
              {post.explanation && <InSimpleWords>{post.explanation}</InSimpleWords>}
              {post.caption && (
                <div className="mt-12 border-t border-border pt-8">
                  <Label as="p">Caption</Label>
                  <p className="mt-4 font-reading text-base leading-prose whitespace-pre-line text-fg-muted">
                    {post.caption}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="mt-5 font-display text-3xl leading-tight font-light tracking-tight">
                {title}
              </h1>

              {post.caption && (
                <>
                  <hr aria-hidden="true" className="my-10 border-border" />
                  {/* Captions are often poems: line breaks are preserved. */}
                  <Prose language={c.language} variant="poem">
                    {post.caption}
                  </Prose>
                </>
              )}
            </>
          )}

          <dl className="mt-14 space-y-4 border-t border-border pt-8">
            {category && (
              <Meta label="Category">
                <Link
                  href={`/instagram?category=${category.key}`}
                  className="no-underline hover:text-fg"
                >
                  {category.label}
                </Link>
              </Meta>
            )}
            {c.themes.length > 0 && (
              <Meta label="Themes">{c.themes.map(humanizeKey).join(', ')}</Meta>
            )}
            {c.emotions.length > 0 && (
              <Meta label="Emotions">{c.emotions.map(humanizeKey).join(', ')}</Meta>
            )}
            {c.language !== 'UNKNOWN' && (
              <Meta label="Language">
                {c.language.charAt(0) + c.language.slice(1).toLowerCase()}
              </Meta>
            )}
          </dl>

          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-12 inline-flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-fg uppercase no-underline hover:text-accent"
            >
              View on Instagram ↗
            </a>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-28" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="mb-12 border-t border-border pt-8 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
          >
            Related posts
          </h2>
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r._id}>
                <PostTile post={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

/**
 * One piece, set the same way every time: the writing, then his name, then the day it
 * was published. A carousel's slides follow one another, parted by a short rule.
 */
function Writing({
  text,
  language,
  timestamp,
}: {
  text: string;
  language: InstagramMediaDto['classification']['language'];
  timestamp: string;
}) {
  const parts = text
    .split(/\n\s*---\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    <div className="mt-10">
      {parts.map((part, i) => (
        <div key={i}>
          {i > 0 && <hr aria-hidden="true" className="my-10 w-12 border-border-strong" />}
          <Prose language={language} variant="poem">
            {part}
          </Prose>
        </div>
      ))}
      <p className="mt-10 font-display text-2xl leading-none font-light text-fg italic">~Triyan</p>
      <p className="mt-3 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        <time dateTime={timestamp}>
          {new Date(timestamp).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </p>
    </div>
  );
}

/**
 * The archived Instagram card, uncropped. A carousel becomes a strip that is swiped or
 * scrolled sideways; it needs no script, and every slide stays reachable by keyboard.
 */
function ArchiveMedia({ post, title }: { post: InstagramMediaDto; title: string }) {
  const slides = archiveSlides(post);
  const alt = post.altText || title;
  if (slides.length === 1) {
    const [only] = slides;
    if (!only) return null;
    return (
      <div className="mx-auto max-w-[32rem] border border-border bg-white">
        <Image
          src={only.mediaUrl}
          alt={alt}
          width={only.mediaWidth}
          height={only.mediaHeight}
          priority
          className="block h-auto w-full"
        />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[32rem]">
      <ul
        tabIndex={0}
        aria-label={`${slides.length} slides. Scroll sideways to read them.`}
        className="flex snap-x snap-mandatory items-start no-scrollbar overflow-x-auto border border-border bg-white"
      >
        {slides.map((slide, i) => (
          <li key={slide.mediaUrl} className="w-full shrink-0 snap-center">
            <Image
              src={slide.mediaUrl}
              alt={i === 0 ? alt : `${title}, slide ${i + 1} of ${slides.length}`}
              width={slide.mediaWidth}
              height={slide.mediaHeight}
              priority={i === 0}
              className="block h-auto w-full"
            />
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        {slides.length} slides · swipe or scroll sideways →
      </p>
    </div>
  );
}

function Media({ post, title }: { post: InstagramMediaDto; title: string }) {
  const alt = post.altText || title;
  if (post.mediaType === 'VIDEO' && post.mediaUrl) {
    return (
      <video
        controls
        preload="none"
        playsInline
        poster={post.thumbnailUrl || undefined}
        className="w-full bg-surface"
        aria-label={alt}
      >
        <source src={post.mediaUrl} />
      </video>
    );
  }
  const image = postImage(post);
  if (!image) {
    return (
      <div className="portrait-void flex aspect-[4/5] items-end bg-surface p-8">
        <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
          Media is viewable on Instagram
        </p>
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/5] bg-surface">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="(min-width: 1024px) 45vw, 90vw"
        className="object-cover"
      />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4">
      <Label as="dt">{label}</Label>
      <dd className="font-reading text-base text-fg-muted">{children}</dd>
    </div>
  );
}
