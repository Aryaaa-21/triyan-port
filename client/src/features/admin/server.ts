import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env';

/**
 * Server-side admin fetch. Forwards the caller's session cookie to the API so admin
 * pages can render their data on the server — no client fetch waterfall, no loading
 * flash, and no effect that sets state on mount.
 */
export interface AdminFetchResult<T> {
  status: number;
  data: T | null;
}

export const adminFetch = async <T>(path: string): Promise<AdminFetchResult<T>> => {
  const { API_BASE_URL } = serverEnv();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      headers: { accept: 'application/json', ...(cookieHeader ? { cookie: cookieHeader } : {}) },
      cache: 'no-store',
    });

    if (!response.ok) return { status: response.status, data: null };

    const body = (await response.json()) as { data?: T };
    return { status: response.status, data: body.data ?? null };
  } catch {
    return { status: 503, data: null };
  }
};
