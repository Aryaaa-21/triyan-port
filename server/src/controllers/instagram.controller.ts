import type { RequestHandler } from 'express';
import {
  classificationOverrideSchema,
  instagramAdminUpdateSchema,
  instagramQuerySchema,
  objectIdSchema,
  reclassifyRequestSchema,
  syncRequestSchema,
} from '@triyan/shared';
import { HttpError } from '../utils/httpError.js';
import { noStore, ok, publicCache } from '../utils/respond.js';
import { getInstagramProvider } from '../services/instagram/index.js';
import { runSync } from '../services/instagram/sync.service.js';
import {
  adminUpdateMedia,
  applyOverride,
  findPublicMedia,
  findRelatedMedia,
  getSyncStatus,
  listMedia,
  reclassify,
  refreshMedia,
} from '../services/instagram/media.service.js';

/* ------------------------------------------------------------------ public */

export const getInstagram: RequestHandler = async (req, res, next) => {
  const parsed = instagramQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(parsed.error);
  const page = await listMedia(parsed.data);
  publicCache(res, 120);
  ok(res, page.items, page.meta);
};

export const getInstagramItem: RequestHandler = async (req, res, next) => {
  const item = await findPublicMedia(String(req.params.id ?? ''));
  if (!item) return next(HttpError.notFound('No post lives at that address'));
  const related = await findRelatedMedia(item);
  publicCache(res, 300);
  ok(res, item, { related });
};

/* ------------------------------------------------------------------- admin */

export const adminListInstagram: RequestHandler = async (req, res, next) => {
  const parsed = instagramQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(parsed.error);
  const needsReview = req.query.needsReview === 'true';
  const page = await listMedia(
    parsed.data,
    needsReview ? { 'classification.needsReview': true } : {},
  );
  noStore(res);
  ok(res, page.items, page.meta);
};

export const adminSyncStatus: RequestHandler = async (_req, res) => {
  noStore(res);
  ok(res, await getSyncStatus());
};

export const adminRunSync: RequestHandler = async (req, res, next) => {
  const parsed = syncRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) return next(parsed.error);
  const result = await runSync({ mode: parsed.data.mode, provider: getInstagramProvider() });
  noStore(res);
  // A missing credential is a configuration problem, not a server crash.
  if (result.reason === 'MISSING_CREDENTIALS') {
    return next(HttpError.upstream('Instagram is not configured: credentials are missing'));
  }
  if (result.reason === 'LOCKED') return next(HttpError.conflict('A sync is already running'));
  ok(res, result, { status: await getSyncStatus() });
};

export const adminUpdateInstagram: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());
  const parsed = instagramAdminUpdateSchema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);
  const item = await adminUpdateMedia(id.data, parsed.data);
  if (!item) return next(HttpError.notFound());
  noStore(res);
  ok(res, item);
};

export const adminOverrideClassification: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());
  const parsed = classificationOverrideSchema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);
  const by = req.admin?.email ?? 'admin';
  const item = await applyOverride(id.data, parsed.data, by);
  if (!item) return next(HttpError.notFound());
  noStore(res);
  ok(res, item);
};

export const adminReclassify: RequestHandler = async (req, res, next) => {
  const parsed = reclassifyRequestSchema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);
  noStore(res);
  ok(res, await reclassify(parsed.data));
};

export const adminRefreshInstagram: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());
  try {
    const item = await refreshMedia(id.data);
    if (!item) return next(HttpError.notFound());
    noStore(res);
    ok(res, item);
  } catch {
    next(HttpError.upstream('Instagram could not be reached to refresh this post'));
  }
};
