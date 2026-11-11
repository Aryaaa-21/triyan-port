import type { CursorMeta, InstagramMediaDto } from '@triyan/shared';
import { apiFetch, CACHE_TAGS } from '@/lib/api';

export interface InstagramQuery {
  cursor?: string;
  category?: string;
  language?: string;
  productType?: string;
  limit?: string;
  featured?: string;
}

const qs = (query: InstagramQuery) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const fetchInstagram = (query: InstagramQuery = {}) =>
  apiFetch<InstagramMediaDto[], CursorMeta>(`/api/v1/instagram${qs(query)}`, {
    tags: [CACHE_TAGS.instagram],
    revalidate: 120,
  });

export const fetchInstagramItem = (id: string) =>
  apiFetch<InstagramMediaDto, { related: InstagramMediaDto[] }>(
    `/api/v1/instagram/${encodeURIComponent(id)}`,
    { tags: [CACHE_TAGS.instagram, CACHE_TAGS.instagramItem(id)], revalidate: 300 },
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

export const postKind = (post: InstagramMediaDto): string =>
  post.productType === 'REELS'
    ? 'Reel'
    : post.mediaType === 'CAROUSEL_ALBUM'
      ? 'Carousel'
      : post.mediaType === 'VIDEO'
        ? 'Video'
        : 'Post';
