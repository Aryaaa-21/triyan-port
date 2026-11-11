import type { InstagramMediaType, InstagramProductType } from '@triyan/shared';

/** Provider-neutral shape of one post. */
export interface ProviderMedia {
  sourceId: string;
  permalink: string;
  mediaType: InstagramMediaType;
  productType: InstagramProductType;
  caption: string;
  timestamp: Date;
  mediaUrl: string;
  thumbnailUrl: string;
  children: { mediaType: InstagramMediaType; mediaUrl: string; thumbnailUrl: string }[];
}

export interface ProviderPage {
  items: ProviderMedia[];
  /** Opaque cursor for the next (older) page, or null at the end. */
  nextCursor: string | null;
}

export type ProviderErrorKind =
  | 'MISSING_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'NOT_FOUND'
  | 'MALFORMED';

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  /** For RATE_LIMITED: when to try again. */
  readonly retryAfterMs: number | null;

  constructor(kind: ProviderErrorKind, message: string, retryAfterMs: number | null = null) {
    super(message);
    this.name = 'ProviderError';
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }

  /** Worth retrying within the same run. */
  get transient(): boolean {
    return this.kind === 'UNAVAILABLE';
  }
}

/**
 * Anything that can list @triyanwrites media. The app depends on this interface
 * only, so switching mock → graph is a config change, not a rewrite.
 */
export interface InstagramProvider {
  readonly name: 'graph' | 'mock';
  /** Whether credentials are present. A provider that is not configured never calls out. */
  readonly configured: boolean;
  fetchPage(cursor: string | null, limit: number): Promise<ProviderPage>;
  fetchOne(sourceId: string): Promise<ProviderMedia>;
}
