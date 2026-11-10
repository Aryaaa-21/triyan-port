import type { ApiErrorBody, ApiSuccess } from '@triyan/shared';
import { serverEnv } from './env';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ApiRequestOptions {
  /** ISR cache tags, invalidated by the server after an admin mutation. */
  tags?: string[];
  revalidate?: number | false;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Set for admin traffic proxied through this origin. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Server-side API client. Every public page renders through this, so a page is
 * cacheable by default and the site stays readable when the API is unavailable
 * (ARCHITECTURE §2.4).
 */
export const apiFetch = async <T, M = undefined>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccess<T, M>> => {
  const { API_BASE_URL } = serverEnv();
  const { tags, revalidate = 300, method = 'GET', body, headers = {}, signal } = options;

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
    next: method === 'GET' ? { revalidate, ...(tags ? { tags } : {}) } : undefined,
    ...(method === 'GET' ? {} : { cache: 'no-store' }),
  });

  if (!response.ok) {
    let code = 'UPSTREAM_UNAVAILABLE';
    let message = `API request failed with status ${response.status}`;
    try {
      const parsed = (await response.json()) as ApiErrorBody;
      if (parsed.error) {
        code = parsed.error.code;
        message = parsed.error.message;
      }
    } catch {
      // Non-JSON error body; keep the defaults.
    }
    throw new ApiError(response.status, code, message);
  }

  return (await response.json()) as ApiSuccess<T, M>;
};

/** Cache tags used across the site. Mirrors ARCHITECTURE §2.3. */
export const CACHE_TAGS = {
  writings: 'writings',
  writing: (slug: string) => `writing:${slug}`,
  instagram: 'instagram',
  instagramItem: (id: string) => `instagram:${id}`,
  taxonomy: 'taxonomy',
  book: 'book',
  about: 'about',
  abyss: 'abyss',
  settings: 'settings',
} as const;
