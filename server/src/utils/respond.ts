import type { Response } from 'express';
import type { ApiSuccess } from '@triyan/shared';

export const ok = <T, M>(res: Response, data: T, meta?: M): Response => {
  const body: ApiSuccess<T, M> = meta === undefined ? { data } : { data, meta };
  return res.json(body);
};

export const created = <T>(res: Response, data: T): Response => res.status(201).json({ data });

export const accepted = <T>(res: Response, data: T): Response => res.status(202).json({ data });

export const noContent = (res: Response): Response => res.status(204).end();

/**
 * Public read responses are cacheable at the edge; everything else must not be.
 * `s-maxage` lets the CDN serve stale content while revalidating, which is what keeps
 * the site readable when the API is down (ARCHITECTURE §2.4).
 */
export const publicCache = (res: Response, seconds: number, staleSeconds = seconds * 10): void => {
  res.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${staleSeconds}, stale-if-error=86400`,
  );
};

export const noStore = (res: Response): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
};
