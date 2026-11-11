import type {
  AdminUserDto,
  InstagramMediaDto,
  PageMeta,
  SyncStatusDto,
  WritingDto,
} from '@triyan/shared';

/**
 * Browser-side admin client. The site and the API share an origin, so the session
 * cookie is first-party.
 */

export class AdminError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AdminError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface Envelope<T> {
  data?: T;
  meta?: PageMeta;
  error?: { code: string; message: string; details?: unknown };
}

const call = async <T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> => {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (response.status === 204) return {};

  let body: Envelope<T> = {};
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    // Non-JSON response; fall through to the status-based error below.
  }

  if (!response.ok) {
    throw new AdminError(
      response.status,
      body.error?.code ?? 'INTERNAL',
      body.error?.message ?? 'Something went wrong',
      body.error?.details,
    );
  }

  return body;
};

export const adminApi = {
  login: (email: string, password: string) =>
    call<AdminUserDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => call<null>('/auth/logout', { method: 'POST' }),

  me: () => call<AdminUserDto>('/auth/me'),

  listWritings: (search = '') => call<WritingDto[]>(`/admin/writings${search}`),

  getWriting: (id: string) => call<WritingDto>(`/admin/writings/${id}`),

  createWriting: (payload: Record<string, unknown>) =>
    call<WritingDto>('/admin/writings', { method: 'POST', body: JSON.stringify(payload) }),

  updateWriting: (id: string, payload: Record<string, unknown>) =>
    call<WritingDto>(`/admin/writings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  publish: (id: string) => call<WritingDto>(`/admin/writings/${id}/publish`, { method: 'POST' }),

  unpublish: (id: string) =>
    call<WritingDto>(`/admin/writings/${id}/unpublish`, { method: 'POST' }),

  remove: (id: string) => call<null>(`/admin/writings/${id}`, { method: 'DELETE' }),

  syncInstagram: (mode: 'FULL' | 'INCREMENTAL') =>
    call<{ status: string; created: number; updated: number; fetched: number }>(
      '/admin/instagram/sync',
      { method: 'POST', body: JSON.stringify({ mode }) },
    ),

  syncStatus: () => call<SyncStatusDto>('/admin/instagram/sync'),

  reclassifyInstagram: (scope: 'ALL' | 'NEEDS_REVIEW') =>
    call<{ reclassified: number }>('/admin/instagram/reclassify', {
      method: 'POST',
      body: JSON.stringify({ confirm: true, scope }),
    }),

  updateInstagram: (id: string, payload: { featured?: boolean; hidden?: boolean }) =>
    call<InstagramMediaDto>(`/admin/instagram/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  correctInstagram: (id: string, payload: Record<string, unknown>) =>
    call<InstagramMediaDto>(`/admin/instagram/${id}/classification`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markMessage: (id: string, read: boolean) =>
    call<null>(`/admin/inbox/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) }),

  deleteMessage: (id: string) => call<null>(`/admin/inbox/${id}`, { method: 'DELETE' }),

  refreshInstagram: (id: string) =>
    call<InstagramMediaDto>(`/admin/instagram/${id}/refresh`, { method: 'POST' }),
};
