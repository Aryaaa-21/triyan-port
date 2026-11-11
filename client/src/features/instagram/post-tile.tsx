import Image from 'next/image';
import Link from 'next/link';
import { getCategory, type InstagramMediaDto } from '@triyan/shared';
import { postImage, postKind, postTitle } from './api';

/**
 * One synced post. When the post has no usable image (a reel without a poster, or
 * an expired CDN link) the tile shows the caption as type rather than inventing art.
 */
export function PostTile({ post }: { post: InstagramMediaDto }) {
  const image = postImage(post);
  const category = post.classification.primaryCategory
    ? getCategory(post.classification.primaryCategory)
    : undefined;
  const title = postTitle(post);

  return (
    <Link
      href={`/instagram/${post._id}`}
      className="group block no-underline"
      data-cursor="writing"
    >
      <div className="relative aspect-square overflow-hidden border border-border bg-bg-raised">
        {image ? (
          <Image
            src={image}
            alt={post.altText || title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : (
          <p
            lang={post.classification.language === 'HINDI' ? 'hi' : undefined}
            className="absolute inset-0 overflow-hidden px-6 pt-14 pb-6 font-reading text-base leading-relaxed whitespace-pre-line text-fg-muted"
          >
            {post.caption || title}
          </p>
        )}
        <span className="absolute top-3 left-3 bg-bg/80 px-2 py-1 font-ui text-2xs tracking-widest text-fg-subtle uppercase">
          {postKind(post)}
        </span>
      </div>
      <p className="mt-4 line-clamp-2 font-display text-lg leading-snug font-light text-fg-muted transition-colors group-hover:text-fg">
        {title}
      </p>
      <p className="mt-2 font-ui text-2xs tracking-widest text-fg-subtle uppercase">
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
