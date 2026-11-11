import type { CursorMeta, InstagramMediaDto } from '@triyan/shared';
import { apiFetch } from '@/lib/api';

export interface InstagramQuery {
  cursor?: string;
  category?: string;
  language?: string;
  productType?: string;
  limit?: string;
  featured?: string;
  sort?: string;
}

const qs = (query: InstagramQuery) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const fetchInstagram = (query: InstagramQuery = {}) =>
  apiFetch<InstagramMediaDto[], CursorMeta>(`/api/v1/instagram${qs(query)}`);

export const fetchInstagramItem = (id: string) =>
  apiFetch<InstagramMediaDto, { related: InstagramMediaDto[] }>(
    `/api/v1/instagram/${encodeURIComponent(id)}`,
  );

/** For the homepage and layout: an unreachable API yields nothing, never an error page. */
export const fetchInstagramSafely = async (query: InstagramQuery = {}) =>
  fetchInstagram(query)
    .then((r) => r.data)
    .catch(() => [] as InstagramMediaDto[]);

/** The first line of a caption, as a title when the admin has not set one. */
export const postTitle = (post: Pick<InstagramMediaDto, 'displayTitle' | 'caption'>): string => {
  if (post.displayTitle) return post.displayTitle;
  const line =
    post.caption
      .split('\n')
      .find((l) => l.trim().length > 0)
      ?.trim() ?? '';
  if (!line) return 'Untitled post';
  return line.length > 80 ? `${line.slice(0, 79)}…` : line;
};

export const postImage = (post: InstagramMediaDto): string =>
  post.mediaType === 'VIDEO'
    ? post.thumbnailUrl
    : post.mediaUrl || post.children[0]?.mediaUrl || post.children[0]?.thumbnailUrl || '';

/**
 * A post from the owner's screenshot archive: the image is the whole Instagram card
 * (name, picture, counts) at a known size, and is shown uncropped.
 */
export const isArchivePost = (post: InstagramMediaDto): boolean =>
  post.provider === 'archive' && post.mediaWidth > 0 && post.mediaHeight > 0;

/** The slides of an archive post, in order. A single post is one slide. */
export const archiveSlides = (post: InstagramMediaDto) =>
  post.children.length > 0
    ? post.children
    : [
        {
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          thumbnailUrl: post.thumbnailUrl,
          mediaWidth: post.mediaWidth,
          mediaHeight: post.mediaHeight,
        },
      ];

export const postKind = (post: InstagramMediaDto): string =>
  post.productType === 'REELS'
    ? 'Reel'
    : post.mediaType === 'CAROUSEL_ALBUM'
      ? 'Carousel'
      : post.mediaType === 'VIDEO'
        ? 'Video'
        : 'Post';
