import type { AboutDto, AbyssDto, BookDto, SiteSettingsDto } from '@triyan/shared';
import { apiFetch } from '@/lib/api';

export const fetchBook = () => apiFetch<BookDto>('/api/v1/book');

export const fetchAbout = () => apiFetch<AboutDto>('/api/v1/about');

export const fetchAbyss = () => apiFetch<AbyssDto>('/api/v1/abyss');

export const fetchSettings = () => apiFetch<SiteSettingsDto>('/api/v1/settings');

/**
 * Content fetchers used by the shared layout must never take the page down with
 * them: a footer missing its links is a far better outcome than a 500.
 */
export const fetchAboutSafely = async (): Promise<AboutDto | null> =>
  fetchAbout()
    .then((r) => r.data)
    .catch(() => null);

export const fetchBookSafely = async (): Promise<BookDto | null> =>
  fetchBook()
    .then((r) => r.data)
    .catch(() => null);

export const fetchAbyssSafely = async (): Promise<AbyssDto | null> =>
  fetchAbyss()
    .then((r) => r.data)
    .catch(() => null);
