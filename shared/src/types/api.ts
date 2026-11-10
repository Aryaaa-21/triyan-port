/** The envelope every API response uses. See ARCHITECTURE §6. */
export interface ApiSuccess<T, M = undefined> {
  data: T;
  meta?: M;
}

export interface ApiErrorBody {
  error: {
    /** Stable machine-readable code, e.g. `VALIDATION_FAILED`, `NOT_FOUND`. */
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CursorMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export const API_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  INTERNAL: 'INTERNAL',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
