import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, humanizeKey, type InstagramMediaDto } from '@triyan/shared';
import { fetchInstagramItem, postImage, postKind, postTitle } from '@/features/instagram/api';
import { PostTile } from '@/features/instagram/post-tile';
import { ApiError } from '@/lib/api';
import { siteUrl } from '@/lib/env';
import { Prose } from '@/components/ui/prose';
import { Rule } from '@/components/ui/rule';

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
    <main id="main" className="gutter mx-auto max-w-5xl pt-24 pb-32 sm:pt-32">
      <Link
        href="/instagram"
        className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
      >
        ← Visual memory
      </Link>

      <article className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Media post={post} title={title} />

        <div>
          <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
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
              <Rule className="my-8" />
              {/* Captions are often poems: line breaks are preserved. */}
              <Prose language={c.language} variant="poem">
                {post.caption}
              </Prose>
            </>
          )}

          <dl className="mt-12 space-y-4 font-ui text-xs">
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
              className="mt-12 inline-block border border-border-strong px-5 py-3 font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:border-fg"
            >
              View on Instagram ↗
            </a>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-28" aria-labelledby="related-heading">
          <Rule label="Nearby" className="mb-10" />
          <h2 id="related-heading" className="sr-only">
            Related posts
          </h2>
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
        className="w-full border border-border bg-bg-raised"
        aria-label={alt}
      >
        <source src={post.mediaUrl} />
      </video>
    );
  }
  const image = postImage(post);
  if (!image) {
    return (
      <div className="flex aspect-square items-center justify-center border border-border bg-bg-raised p-8">
        <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
          Media is viewable on Instagram
        </p>
      </div>
    );
  }
  return (
    <div className="relative aspect-square border border-border bg-bg-raised">
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
      <dt className="tracking-widest text-fg-subtle uppercase">{label}</dt>
      <dd className="text-fg-muted">{children}</dd>
    </div>
  );
}
