import type { PageMeta, SitemapEntry, WritingDto } from '@triyan/shared';
import { apiFetch, CACHE_TAGS } from '@/lib/api';

export interface ArchiveQuery {
  q?: string;
  category?: string;
  themes?: string;
  emotions?: string;
  language?: string;
  tags?: string;
  featured?: string;
  sort?: string;
  page?: string;
}

const toSearchParams = (query: ArchiveQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
};

export const fetchWritings = async (query: ArchiveQuery = {}) =>
  apiFetch<WritingDto[], PageMeta>(`/api/v1/writings${toSearchParams(query)}`, {
    tags: [CACHE_TAGS.writings],
    revalidate: 120,
  });

export const fetchWriting = async (slug: string) =>
  apiFetch<WritingDto>(`/api/v1/writings/${encodeURIComponent(slug)}`, {
    tags: [CACHE_TAGS.writings, CACHE_TAGS.writing(slug)],
    revalidate: 300,
  });

export const fetchRelated = async (slug: string) =>
  apiFetch<WritingDto[]>(`/api/v1/writings/${encodeURIComponent(slug)}/related`, {
    tags: [CACHE_TAGS.writings, CACHE_TAGS.writing(slug)],
    revalidate: 300,
  });

export const fetchSitemapEntries = async () =>
  apiFetch<SitemapEntry[]>('/api/v1/sitemap-entries', {
    tags: [CACHE_TAGS.writings],
    revalidate: 600,
  });
