import { INSTAGRAM_MEDIA_TYPES, INSTAGRAM_PRODUCT_TYPES } from '@triyan/shared';
import type { InstagramMediaType, InstagramProductType } from '@triyan/shared';
import {
  ProviderError,
  type InstagramProvider,
  type ProviderMedia,
  type ProviderPage,
} from './provider.js';

/**
 * The official Instagram API (Instagram API with Instagram Login, graph.instagram.com).
 *
 * Requires a Professional account and a long-lived token with `instagram_business_basic`.
 * Without a token this provider reports itself unconfigured and never calls out.
 * The real connection has not been exercised: no credentials have been supplied.
 */

const API_VERSION = 'v21.0';
const BASE = `https://graph.instagram.com/${API_VERSION}`;
const FIELDS =
  'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';

type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}>;

interface GraphMedia {
  id?: unknown;
  caption?: unknown;
  media_type?: unknown;
  media_product_type?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  permalink?: unknown;
  timestamp?: unknown;
  children?: { data?: GraphMedia[] };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const mediaType = (v: unknown): InstagramMediaType =>
  (INSTAGRAM_MEDIA_TYPES as readonly string[]).includes(str(v))
    ? (v as InstagramMediaType)
    : 'IMAGE';

const productType = (v: unknown): InstagramProductType =>
  (INSTAGRAM_PRODUCT_TYPES as readonly string[]).includes(str(v))
    ? (v as InstagramProductType)
    : 'UNKNOWN';

export const mapGraphMedia = (raw: GraphMedia): ProviderMedia => {
  const id = str(raw.id);
  const timestamp = new Date(str(raw.timestamp));
  if (!id || Number.isNaN(timestamp.getTime())) {
    throw new ProviderError('MALFORMED', 'Media item without id or timestamp');
  }
  return {
    sourceId: id,
    permalink: str(raw.permalink),
    mediaType: mediaType(raw.media_type),
    productType: productType(raw.media_product_type),
    caption: str(raw.caption),
    timestamp,
    mediaUrl: str(raw.media_url),
    thumbnailUrl: str(raw.thumbnail_url),
    children: (raw.children?.data ?? []).map((c) => ({
      mediaType: mediaType(c.media_type),
      mediaUrl: str(c.media_url),
      thumbnailUrl: str(c.thumbnail_url),
    })),
  };
};

/** Maps Graph error codes to the provider's error kinds. */
export const classifyGraphError = (status: number, body: unknown, retryAfter: string | null) => {
  const error = (body as { error?: { code?: number; error_subcode?: number; message?: string } })
    ?.error;
  const code = error?.code;
  const message = error?.message ?? `Instagram API responded ${status}`;

  if (code === 190) {
    // 463 = expired, 460 = password changed, 467 = invalid session.
    return error?.error_subcode === 463
      ? new ProviderError('TOKEN_EXPIRED', message)
      : new ProviderError('INVALID_TOKEN', message);
  }
  if (status === 429 || code === 4 || code === 17 || code === 32 || code === 613) {
    const seconds = Number(retryAfter);
    return new ProviderError(
      'RATE_LIMITED',
      message,
      Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60 * 60 * 1000,
    );
  }
  if (status === 404 || code === 100) return new ProviderError('NOT_FOUND', message);
  if (status === 401 || status === 403) return new ProviderError('INVALID_TOKEN', message);
  return new ProviderError('UNAVAILABLE', message);
};

export const createGraphProvider = (
  accessToken: string | undefined,
  fetchImpl: FetchLike = fetch,
): InstagramProvider => {
  const configured = Boolean(accessToken);

  const get = async (url: string): Promise<unknown> => {
    if (!accessToken) {
      throw new ProviderError('MISSING_CREDENTIALS', 'INSTAGRAM_ACCESS_TOKEN is not set');
    }
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(url);
    } catch {
      throw new ProviderError('UNAVAILABLE', 'Instagram API is unreachable');
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok)
      throw classifyGraphError(response.status, body, response.headers.get('retry-after'));
    if (body === null || typeof body !== 'object') {
      throw new ProviderError('MALFORMED', 'Instagram API returned a non-JSON body');
    }
    return body;
  };

  const token = () => `access_token=${encodeURIComponent(accessToken ?? '')}`;

  return {
    name: 'graph',
    configured,

    async fetchPage(cursor, limit): Promise<ProviderPage> {
      const after = cursor ? `&after=${encodeURIComponent(cursor)}` : '';
      const body = (await get(
        `${BASE}/me/media?fields=${encodeURIComponent(FIELDS)}&limit=${limit}${after}&${token()}`,
      )) as { data?: GraphMedia[]; paging?: { cursors?: { after?: string }; next?: string } };

      const items: ProviderMedia[] = [];
      for (const raw of body.data ?? []) {
        try {
          items.push(mapGraphMedia(raw));
        } catch {
          // One malformed item must not fail the page.
        }
      }
      // Graph only includes `next` when there is another page.
      const nextCursor = body.paging?.next ? (body.paging.cursors?.after ?? null) : null;
      return { items, nextCursor };
    },

    async fetchOne(sourceId) {
      const body = await get(
        `${BASE}/${encodeURIComponent(sourceId)}?fields=${encodeURIComponent(FIELDS)}&${token()}`,
      );
      return mapGraphMedia(body as GraphMedia);
    },
  };
};
