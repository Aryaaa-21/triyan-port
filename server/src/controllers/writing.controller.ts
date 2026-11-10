import type { RequestHandler } from 'express';
import {
  objectIdSchema,
  writingInputSchema,
  writingQuerySchema,
  writingUpdateSchema,
} from '@triyan/shared';
import { HttpError } from '../utils/httpError.js';
import { accepted, created, noContent, noStore, ok, publicCache } from '../utils/respond.js';
import {
  createWriting,
  deleteWriting,
  findPublishedBySlug,
  findRelated,
  listWritings,
  publicFilter,
  setStatus,
  updateWriting,
} from '../services/writing.service.js';
import { Writing } from '../models/index.js';

/* ------------------------------------------------------------------- public */

export const getWritings: RequestHandler = async (req, res, next) => {
  const parsed = writingQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(parsed.error);

  const page = await listWritings(parsed.data);
  publicCache(res, 120);
  ok(res, page.items, {
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
  });
};

export const getWritingBySlug: RequestHandler = async (req, res, next) => {
  const slug = String(req.params.slug ?? '');
  const writing = await findPublishedBySlug(slug);

  // A draft and a nonexistent slug are indistinguishable from outside. Returning 403
  // for a draft would confirm it exists.
  if (!writing) return next(HttpError.notFound('No writing lives at that address'));

  publicCache(res, 300);
  ok(res, writing);
};

export const getRelatedWritings: RequestHandler = async (req, res, next) => {
  const slug = String(req.params.slug ?? '');
  const writing = await findPublishedBySlug(slug);
  if (!writing) return next(HttpError.notFound('No writing lives at that address'));

  const related = await findRelated(writing);
  publicCache(res, 300);
  ok(res, related);
};

/** Slugs and last-modified times for the sitemap. Published, indexable writings only. */
export const getSitemapEntries: RequestHandler = async (_req, res) => {
  const entries = await Writing.find({ ...publicFilter(), 'seo.noindex': { $ne: true } })
    .select('slug updatedAt publishedAt')
    .sort({ publishedAt: -1 })
    .lean();
  publicCache(res, 600);
  ok(res, entries);
};

/* -------------------------------------------------------------------- admin */

export const adminListWritings: RequestHandler = async (req, res, next) => {
  const parsed = writingQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(parsed.error);

  // Admin sees everything, including drafts and book-exclusive writings.
  const page = await listWritings(parsed.data, {});
  noStore(res);
  ok(res, page.items, {
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
  });
};

export const adminGetWriting: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());

  const writing = await Writing.findById(id.data).lean();
  if (!writing) return next(HttpError.notFound());

  noStore(res);
  ok(res, writing);
};

export const adminCreateWriting: RequestHandler = async (req, res, next) => {
  const parsed = writingInputSchema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);

  const writing = await createWriting(parsed.data);
  noStore(res);
  created(res, writing.toObject());
};

export const adminUpdateWriting: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());

  const parsed = writingUpdateSchema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);

  const writing = await updateWriting(id.data, parsed.data);
  if (!writing) return next(HttpError.notFound());

  noStore(res);
  ok(res, writing.toObject());
};

export const adminPublishWriting: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());

  const writing = await Writing.findById(id.data);
  if (!writing) return next(HttpError.notFound());

  // A book-exclusive writing must never become publicly readable (spec §33).
  if (writing.bookExclusive) {
    return next(
      HttpError.conflict('This writing is marked book-exclusive and cannot be published publicly'),
    );
  }

  const updated = await setStatus(id.data, 'PUBLISHED');
  noStore(res);
  ok(res, updated?.toObject());
};

export const adminUnpublishWriting: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());

  const writing = await setStatus(id.data, 'DRAFT');
  if (!writing) return next(HttpError.notFound());

  noStore(res);
  ok(res, writing.toObject());
};

export const adminDeleteWriting: RequestHandler = async (req, res, next) => {
  const id = objectIdSchema.safeParse(req.params.id);
  if (!id.success) return next(HttpError.notFound());

  const removed = await deleteWriting(id.data);
  if (!removed) return next(HttpError.notFound());

  noStore(res);
  noContent(res);
};

/** Marks a route as deliberately asynchronous work the client should not await. */
export const adminAcceptedStub: RequestHandler = (_req, res) => accepted(res, { queued: true });
