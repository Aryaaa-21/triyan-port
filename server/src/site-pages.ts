import mongoose from 'mongoose';
import { InstagramMedia, Writing } from './models/index.js';
import { publicFilter } from './services/writing.service.js';
import { publicMediaFilter } from './services/instagram/media.service.js';
import {
  archiveMode,
  archiveStore,
  findArchiveMedia,
  findArchiveWriting,
} from './archive/store.js';

/** The site's fixed pages (the React router knows them; this mirrors it for status codes). */
const FIXED = /^\/(?:writings|about|book|abyss|instagram|contact|subscription|admin(?:\/.*)?)?\/?$/;

/**
 * Whether a path is a real page of the site, so the app is served with 200 and
 * anything else with 404 — not a "soft 404" that search engines would index. A
 * writing or post counts only if it is public. If the database cannot answer, the
 * page is given the benefit of the doubt (the app shows its own error state).
 */
export const isSitePage = async (path: string): Promise<boolean> => {
  if (FIXED.test(path)) return true;

  const writing = /^\/writings\/([^/]+)\/?$/.exec(path)?.[1];
  if (writing && archiveMode) {
    return findArchiveWriting(archiveStore(), decodeURIComponent(writing)) !== null;
  }
  if (writing) {
    return Writing.exists({ ...publicFilter(), slug: decodeURIComponent(writing) })
      .then(Boolean)
      .catch(() => true);
  }

  const post = /^\/instagram\/([^/]+)\/?$/.exec(path)?.[1];
  if (post && archiveMode) return findArchiveMedia(archiveStore(), post) !== null;
  if (post) {
    if (!mongoose.isValidObjectId(post)) return false;
    return InstagramMedia.exists({ ...publicMediaFilter(), _id: post })
      .then(Boolean)
      .catch(() => true);
  }

  return false;
};
