import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, humanizeKey, type InstagramMediaDto } from '@triyan/shared';
import { fetchInstagramItem, postImage, postKind, postTitle } from '@/features/instagram/api';
import { PostTile } from '@/features/instagram/instagram-grid';
import { Label } from '@/components/editorial';
import { ApiError } from '@/lib/api';
import { siteUrl } from '@/lib/env';
import { Prose } from '@/components/ui/prose';

interface PageProps {
  params: Promise<{ id: string }>;
}

const load = async (id: string) => {
  try {
    const res = await fetchInstagramItem(id);
    return { post: res.data, related: res.meta?.related ?? [] };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await load(id);
  if (!found) return { title: 'Not found', robots: { index: false, follow: false } };
  const { post } = found;
  const title = postTitle(post);
  const description = post.caption.replace(/\s+/g, ' ').trim().slice(0, 160) || title;
  const canonical = `${siteUrl}/instagram/${post._id}`;
  const image = postImage(post);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function InstagramPostPage({ params }: PageProps) {
  const { id } = await params;
  const found = await load(id);
  if (!found) notFound();
  const { post, related } = found;
  const c = post.classification;
  const category = c.primaryCategory ? getCategory(c.primaryCategory) : undefined;
  const title = postTitle(post);

  return (
    <main id="main" className="gutter mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
      <Link
        href="/instagram"
        className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase no-underline hover:text-fg"
      >
        ← Visual memory
      </Link>

      <article className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Media post={post} title={title} />
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
