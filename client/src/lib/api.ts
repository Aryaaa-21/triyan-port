import type { ApiErrorBody, ApiSuccess } from '@triyan/shared';

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
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * The browser's API client. The Express server serves the site and the API from one
 * origin, so requests are relative and the session cookie is first-party.
 */
export const apiFetch = async <T, M = undefined>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccess<T, M>> => {
  const { method = 'GET', body, headers = {}, signal } = options;

  const response = await fetch(path.startsWith('/') ? path : `/${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
    ...(method === 'GET' ? {} : { cache: 'no-store' as const }),
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
