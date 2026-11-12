import { Router, type RequestHandler } from 'express';
import { instagramQuerySchema, writingQuerySchema } from '@triyan/shared';
import {
  archiveAbout,
  archiveAbyss,
  archiveBook,
  archiveSettings,
  archiveStore,
  findArchiveMedia,
  findArchiveWriting,
  listArchiveMedia,
  listArchiveWritings,
  relatedArchiveMedia,
  relatedArchiveWritings,
} from '../archive/store.js';
import { HttpError } from '../utils/httpError.js';
import { noStore, ok, publicCache } from '../utils/respond.js';

/**
 * The public API answered from the archive file, for a site with no database (see
 * archive/store.ts). Same addresses and same response shapes as the database routes,
 * so the website cannot tell the difference. Mounted only when no MONGODB_URI is set.
 */
export const archiveRouter = Router();

/* ------------------------------------------------------------------ writings */

archiveRouter.get('/writings', (req, res, next) => {
  const parsed = writingQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(parsed.error);
  const page = listArchiveWritings(archiveStore(), parsed.data);
  publicCache(res, 120);
  ok(res, page.items, {
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
  });
});

archiveRouter.get('/writings/:slug', (req, res, next) => {
  const writing = findArchiveWriting(archiveStore(), String(req.params.slug ?? ''));
  if (!writing) return next(HttpError.notFound('No writing lives at that address'));
  publicCache(res, 300);
  ok(res, writing);
});

archiveRouter.get('/writings/:slug/related', (req, res, next) => {
  const store = archiveStore();
  const writing = findArchiveWriting(store, String(req.params.slug ?? ''));
  if (!writing) return next(HttpError.notFound('No writing lives at that address'));
  publicCache(res, 300);
  ok(res, relatedArchiveWritings(store, writing));
});

archiveRouter.get('/sitemap-entries', (_req, res) => {
  publicCache(res, 600);
  ok(
    res,
    archiveStore().writings.map((w) => ({
      slug: w.slug,
      updatedAt: w.updatedAt,
      publishedAt: w.publishedAt,
    })),
  );
});

/* ----------------------------------------------------------------- instagram */

archiveRouter.get('/instagram', (req, res, next) => {
  const parsed = instagramQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(parsed.error);
  const page = listArchiveMedia(archiveStore(), parsed.data);
  publicCache(res, 120);
  ok(res, page.items, page.meta);
});

archiveRouter.get('/instagram/:id', (req, res, next) => {
  const store = archiveStore();
  const item = findArchiveMedia(store, String(req.params.id ?? ''));
  if (!item) return next(HttpError.notFound('No post lives at that address'));
  publicCache(res, 300);
  ok(res, item, { related: relatedArchiveMedia(store, item) });
});

/* ------------------------------------------------------------------- content */

archiveRouter.get('/book', (_req, res) => {
  publicCache(res, 300);
  ok(res, archiveBook());
});

archiveRouter.get('/about', (_req, res) => {
  publicCache(res, 300);
  ok(res, archiveAbout());
});

archiveRouter.get('/abyss', (_req, res) => {
  publicCache(res, 300);
  ok(res, archiveAbyss());
});

archiveRouter.get('/settings', (_req, res) => {
  publicCache(res, 300);
  ok(res, archiveSettings());
});

/**
 * Everything else needs somewhere to keep things: signing in, the admin, the contact
 * inbox, the waitlist. Say so at once, rather than waiting on a database that is not there.
 */
const needsDatabase: RequestHandler = (_req, res, next) => {
  noStore(res);
  next(
    HttpError.upstream(
      'This part of the site needs a database, and none is connected yet. Reading the archive works without one.',
    ),
  );
};
archiveRouter.use(needsDatabase);
