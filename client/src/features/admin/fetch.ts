/**
 * Admin data for route loaders. The session cookie is first-party (the site and the
 * API share an origin), so the browser sends it with every request.
 */
export interface AdminFetchResult<T> {
  status: number;
  data: T | null;
}

export const adminFetch = async <T>(path: string): Promise<AdminFetchResult<T>> => {
  try {
    const response = await fetch(`/api/v1${path}`, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) return { status: response.status, data: null };
    const body = (await response.json()) as { data?: T };
    return { status: response.status, data: body.data ?? null };
  } catch {
    return { status: 503, data: null };
  }
};
