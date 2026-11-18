import type { PageMeta, SitemapEntry, WritingDto } from '@triyan/shared';
import { apiFetch } from '@/lib/api';

export interface ArchiveQuery {
  q?: string;
  /** A special shelf: 'loved' ranks by Instagram engagement. Not sent to the API. */
  shelf?: string;
  category?: string;
  themes?: string;
  emotions?: string;
  language?: string;
  tags?: string;
  featured?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

const toSearchParams = (query: ArchiveQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === 'shelf') continue;
    if (value) params.set(key, value);
  }
  if (query.shelf === 'loved') params.set('sort', 'popular');
  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
};

export const fetchWritings = async (query: ArchiveQuery = {}) =>
  apiFetch<WritingDto[], PageMeta>(`/api/v1/writings${toSearchParams(query)}`);

export const fetchWriting = async (slug: string) =>
  apiFetch<WritingDto>(`/api/v1/writings/${encodeURIComponent(slug)}`);

export const fetchRelated = async (slug: string) =>
  apiFetch<WritingDto[]>(`/api/v1/writings/${encodeURIComponent(slug)}/related`);

export const fetchSitemapEntries = async () => apiFetch<SitemapEntry[]>('/api/v1/sitemap-entries');
