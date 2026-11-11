import Image from 'next/image';
import Link from 'next/link';
import { getCategory, type InstagramMediaDto } from '@triyan/shared';
import { cn } from '@/lib/cn';
import { postImage, postKind, postTitle } from './api';
import { CategoryArt } from '@/components/art';

/**
 * The visual archive. Posts are laid out in an editorial rhythm — one feature beside
 * two standard pieces, mirrored on the next row — so the grid reads like a spread,
 * not a wall of identical squares. Order in the DOM is chronological, so keyboard
 * and screen-reader order match the timeline.
 */
export function InstagramGrid({ posts }: { posts: InstagramMediaDto[] }) {
  const rows: InstagramMediaDto[][] = [];
  for (let i = 0; i < posts.length; i += 3) rows.push(posts.slice(i, i + 3));

  return (
    <div className="space-y-16 lg:space-y-24">
      {rows.map((row, r) => {
        const mirrored = r % 2 === 1;
        return (
          <ul
            key={row[0]?._id ?? r}
            className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-12"
          >
            {row.map((post, i) => {
              const feature = i === 0 && row.length === 3;
              return (
                <li
                  key={post._id}
                  className={cn(
                    feature
                      ? cn(
                          'sm:col-span-2 lg:col-span-7 lg:row-span-2',
                          mirrored && 'lg:col-start-6',
                        )
                      : cn('lg:col-span-5', mirrored && 'lg:col-start-1'),
                    !feature && mirrored && i === 1 && 'lg:row-start-1',
                    !feature && mirrored && i === 2 && 'lg:row-start-2',
                  )}
                >
                  <PostTile post={post} feature={feature} />
                </li>
              );
            })}
          </ul>
        );
      })}
    </div>
  );
}

export function PostTile({
  post,
  feature = false,
}: {
  post: InstagramMediaDto;
  feature?: boolean;
}) {
  const image = postImage(post);
  const category = post.classification.primaryCategory
    ? getCategory(post.classification.primaryCategory)
    : undefined;
  const title = postTitle(post);
  const hindi = post.classification.language === 'HINDI';

  return (
    <Link
      href={`/instagram/${post._id}`}
      data-cursor={image ? 'view' : 'writing'}
      className={cn('group flex flex-col no-underline', feature && 'lg:h-full')}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-surface',
          feature ? 'aspect-[4/5] lg:aspect-auto lg:min-h-[28rem] lg:flex-1' : 'aspect-[16/11]',
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={post.altText || title}
            fill
            sizes={
              feature
                ? '(min-width: 1024px) 55vw, 90vw'
                : '(min-width: 1024px) 38vw, (min-width: 640px) 45vw, 90vw'
            }
            className="object-cover opacity-80 grayscale-[35%] transition-[opacity,filter,scale] duration-1000 ease-void group-hover:scale-[1.03] group-hover:opacity-100 group-hover:grayscale-0"
          />
        ) : (
          // A text post is shown as its text. The shelf's artwork sits faintly behind it
          // as atmosphere; it is never presented as the post's own image.
          <>
            {post.classification.primaryCategory && (
              <CategoryArt
                category={post.classification.primaryCategory}
                className="absolute inset-0 opacity-45 transition-opacity duration-1000 group-hover:opacity-70"
              />
            )}
            <p
              lang={hindi ? 'hi' : undefined}
              className={cn(
                'absolute inset-0 overflow-hidden whitespace-pre-line text-fg transition-colors duration-700',
                feature
                  ? 'p-8 font-display text-3xl leading-snug font-light sm:p-12 sm:text-4xl'
                  : 'p-6 pt-12 font-reading text-base leading-relaxed',
              )}
            >
              {post.caption || title}
            </p>
          </>
        )}
        <span className="absolute top-4 left-4 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase mix-blend-difference">
          {postKind(post)}
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-6">
        <p
          className={cn(
            'line-clamp-1 font-display font-light text-fg-muted transition-colors group-hover:text-fg',
            feature ? 'text-2xl' : 'text-lg',
          )}
        >
          {title}
        </p>
        <span
          aria-hidden="true"
          className="font-mono text-xs text-fg-subtle transition-transform duration-500 group-hover:translate-x-1"
        >
          →
        </span>
      </div>
      <p className="mt-1 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        <time dateTime={post.timestamp}>
          {new Date(post.timestamp).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
          })}
        </time>
        {category && <span> · {category.label}</span>}
      </p>
    </Link>
  );
}
