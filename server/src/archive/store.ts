import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AboutDto,
  AbyssDto,
  BookDto,
  CategoryKey,
  InstagramMediaDto,
  InstagramQuery,
  SiteSettingsDto,
  WritingDto,
  WritingQuery,
} from '@triyan/shared';
import { CONFIDENCE_REVIEW_THRESHOLD } from '@triyan/shared';
import { env, isTest } from '../config/env.js';
import { SEED_ABOUT, SEED_ABYSS, SEED_BOOK, SEED_SETTINGS } from '../content/seed.js';
import { deriveExcerpt, RELATED_WEIGHTS } from '../services/writing.service.js';

/**
 * The site without a database.
 *
 * Everything the public pages show is already in the repository: the archive file
 * (`server/data/instagram-archive.json`), its images under `client/public`, and the
 * owner's own words about himself and the book. When no `MONGODB_URI` is configured,
 * the API answers its public, read-only routes from those, held in memory.
 *
 * What it cannot do is remember anything: there is no admin, no contact inbox and no
 * waitlist until a database is connected. Adding `MONGODB_URI` switches the whole API
 * back to the database, and this module is not used at all.
 */

/* ------------------------------------------------------------------ the file */

interface ArchiveSlide {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
}

interface ArchiveClassification {
  primaryCategory: CategoryKey;
  secondaryCategories?: CategoryKey[];
  themes?: WritingDto['themes'];
  emotions?: WritingDto['emotions'];
  language?: WritingDto['language'];
  confidence?: number;
}

interface ArchivePost {
  code: string;
  kind: 'post' | 'reel';
  timestamp: string;
  caption: string;
  displayTitle?: string;
  altText?: string;
  text?: string;
  explanation?: string;
  hidden?: boolean;
  slides: ArchiveSlide[];
  classification: ArchiveClassification;
}

interface ArchiveWriting {
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
  contentType?: WritingDto['contentType'];
  language?: WritingDto['language'];
  primaryCategory: CategoryKey;
  secondaryCategories?: CategoryKey[];
  themes?: WritingDto['themes'];
  emotions?: WritingDto['emotions'];
  explanation?: string;
  instagramUrl?: string;
}

export interface ArchiveFile {
  classifierVersion?: string;
  posts: ArchivePost[];
  writings?: ArchiveWriting[];
}

const here = dirname(fileURLToPath(import.meta.url));

/** The archive file: beside the function on Vercel, beside this package elsewhere. */
export const ARCHIVE_FILE_CANDIDATES = [
  resolve(process.cwd(), 'server/data/instagram-archive.json'),
  resolve(process.cwd(), 'data/instagram-archive.json'),
  resolve(here, '../../data/instagram-archive.json'),
];

const archiveFilePath = (): string | undefined => ARCHIVE_FILE_CANDIDATES.find(existsSync);

/**
 * Whether the API should answer from the archive file: no database is configured and
 * the file is there. Tests always use their own database.
 */
export const archiveMode = !env.MONGODB_URI && !isTest && archiveFilePath() !== undefined;

/* -------------------------------------------------------------------- shapes */

/** A stable 24-hex id from a post's shortcode or a writing's slug, shaped like an ObjectId. */
export const archiveId = (key: string): string =>
  createHash('md5').update(key).digest('hex').slice(0, 24);

const toWriting = (w: ArchiveWriting): WritingDto => ({
  _id: archiveId(`writing:${w.slug}`),
  slug: w.slug,
  title: w.title,
  content: w.content,
  excerpt: deriveExcerpt(w.content),
  explanation: w.explanation ?? '',
  instagramUrl: w.instagramUrl ?? '',
  language: w.language ?? 'UNKNOWN',
  contentType: w.contentType ?? 'POEM',
  primaryCategory: w.primaryCategory,
  secondaryCategories: (w.secondaryCategories ?? []).filter((k) => k !== w.primaryCategory),
  themes: w.themes ?? [],
  emotions: w.emotions ?? [],
  tags: [],
  status: 'PUBLISHED',
  featured: false,
  publishedAt: new Date(w.publishedAt).toISOString(),
  bookExclusive: false,
  seo: { noindex: false },
  createdAt: new Date(w.publishedAt).toISOString(),
  updatedAt: new Date(w.publishedAt).toISOString(),
});

const toMedia = (p: ArchivePost, classifierVersion: string): InstagramMediaDto => {
  const [first, ...rest] = p.slides;
  const c = p.classification;
  const stamp = new Date(p.timestamp).toISOString();
  const confidence = c.confidence ?? 0.8;
  return {
    _id: archiveId(p.code),
    sourceId: p.code,
    permalink: `https://www.instagram.com/${p.kind === 'reel' ? 'reel' : 'p'}/${p.code}/`,
    mediaType: rest.length > 0 ? 'CAROUSEL_ALBUM' : 'IMAGE',
    productType: p.kind === 'reel' ? 'REELS' : 'FEED',
    caption: p.caption,
    timestamp: stamp,
    mediaUrl: first?.url ?? '',
    thumbnailUrl: first?.thumbUrl ?? '',
    mediaWidth: first?.width ?? 0,
    mediaHeight: first?.height ?? 0,
    children:
      rest.length > 0
        ? p.slides.map((s) => ({
            mediaType: 'IMAGE' as const,
            mediaUrl: s.url,
            thumbnailUrl: s.thumbUrl,
            mediaWidth: s.width,
            mediaHeight: s.height,
          }))
        : [],
    classification: {
      primaryCategory: c.primaryCategory,
      secondaryCategories: (c.secondaryCategories ?? []).filter((k) => k !== c.primaryCategory),
      themes: c.themes ?? [],
      emotions: c.emotions ?? [],
      language: c.language ?? 'UNKNOWN',
      confidence,
      needsReview: confidence < CONFIDENCE_REVIEW_THRESHOLD,
      method: 'LLM',
      classifierVersion,
      classifiedAt: stamp,
    },
    manualOverride: true,
    featured: false,
    hidden: false,
    displayTitle: p.displayTitle ?? '',
    altText: p.altText ?? '',
    text: p.text ?? '',
    explanation: p.explanation ?? '',
    available: true,
    provider: 'archive',
    syncedAt: stamp,
  };
};

/* --------------------------------------------------------------------- store */

export interface ArchiveStore {
  /** Published writings, newest first. */
  writings: WritingDto[];
  /** Visible posts, newest first. */
  media: InstagramMediaDto[];
}

export const buildStore = (file: ArchiveFile): ArchiveStore => {
  const newestFirst = (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime();
  return {
    writings: (file.writings ?? [])
      .map(toWriting)
      .sort((a, b) => newestFirst(a.publishedAt ?? '', b.publishedAt ?? '')),
    media: file.posts
      .filter((p) => !p.hidden && p.slides.length > 0)
      .map((p) => toMedia(p, file.classifierVersion ?? ''))
      .sort((a, b) => newestFirst(a.timestamp, b.timestamp) || b._id.localeCompare(a._id)),
  };
};

let cached: ArchiveStore | null = null;

/** The archive, read once per process. */
export const archiveStore = (): ArchiveStore => {
  if (cached) return cached;
  const path = archiveFilePath();
  cached = path
    ? buildStore(JSON.parse(readFileSync(path, 'utf8')) as ArchiveFile)
    : { writings: [], media: [] };
  return cached;
};

/* ------------------------------------------------------------------ writings */

const words = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

export const listArchiveWritings = (store: ArchiveStore, query: WritingQuery) => {
  const categories = query.categories ?? (query.category ? [query.category] : []);
  const terms = query.q ? words(query.q) : [];
  let items = store.writings.filter((w) => {
    if (
      categories.length &&
      !categories.some((c) => w.primaryCategory === c || w.secondaryCategories.includes(c))
    ) {
      return false;
    }
    if (query.themes?.length && !query.themes.every((t) => w.themes.includes(t))) return false;
    if (query.emotions?.length && !query.emotions.every((e) => w.emotions.includes(e))) {
      return false;
    }
    if (query.tags?.length) return false; // archive writings carry no tags
    if (query.language && w.language !== query.language) return false;
    if (query.featured !== undefined && w.featured !== query.featured) return false;
    const at = w.publishedAt ? new Date(w.publishedAt) : null;
    if (query.from && (!at || at < query.from)) return false;
    if (query.to && (!at || at > query.to)) return false;
    if (terms.length) {
      const haystack = `${w.title}\n${w.content}`.toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  if (query.sort === 'oldest') items = [...items].reverse();
  else if (query.sort === 'title') {
    items = [...items].sort((a, b) => a.title.localeCompare(b.title));
  } else if (terms.length) {
    // A match in the title outranks one in the body; ties stay newest first.
    const inTitle = (w: WritingDto) =>
      terms.every((t) => w.title.toLowerCase().includes(t)) ? 1 : 0;
    items = [...items].sort((a, b) => inTitle(b) - inTitle(a));
  }

  const total = items.length;
  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
};

export const findArchiveWriting = (store: ArchiveStore, slug: string): WritingDto | null =>
  store.writings.find((w) => w.slug === slug) ?? null;

/** The same deterministic scoring as the database version (see writing.service.ts). */
export const relatedArchiveWritings = (
  store: ArchiveStore,
  writing: WritingDto,
  limit = 3,
): WritingDto[] => {
  const categories = [writing.primaryCategory, ...writing.secondaryCategories].filter(
    (c): c is CategoryKey => Boolean(c),
  );
  return store.writings
    .filter((w) => w.slug !== writing.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.primaryCategory && candidate.primaryCategory === writing.primaryCategory) {
        score += RELATED_WEIGHTS.primaryCategory;
      }
      for (const c of candidate.secondaryCategories) {
        if (categories.includes(c)) score += RELATED_WEIGHTS.secondaryCategory;
      }
      for (const t of candidate.themes) {
        if (writing.themes.includes(t)) score += RELATED_WEIGHTS.theme;
      }
      if (candidate.language === writing.language && candidate.language !== 'UNKNOWN') {
        score += RELATED_WEIGHTS.language;
      }
      return { candidate, score };
    })
    .filter((e) => e.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.candidate.publishedAt ?? 0).getTime() -
          new Date(a.candidate.publishedAt ?? 0).getTime(),
    )
    .slice(0, limit)
    .map((e) => e.candidate);
};

/* --------------------------------------------------------------------- media */

const encodeCursor = (timestamp: string, id: string) =>
  Buffer.from(`${timestamp}|${id}`).toString('base64url');

const decodeCursor = (cursor: string): { timestamp: string; id: string } | null => {
  try {
    const [timestamp, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return timestamp && id && !Number.isNaN(new Date(timestamp).getTime())
      ? { timestamp, id }
      : null;
  } catch {
    return null;
  }
};

export const listArchiveMedia = (store: ArchiveStore, query: InstagramQuery) => {
  const categories = [...(query.category ? [query.category] : []), ...(query.categories ?? [])];
  const terms = query.q ? words(query.q) : [];
  let items = store.media.filter((m) => {
    const c = m.classification;
    if (
      categories.length &&
      !categories.some((k) => c.primaryCategory === k || c.secondaryCategories.includes(k))
    ) {
      return false;
    }
    if (query.language && c.language !== query.language) return false;
    if (query.mediaType && m.mediaType !== query.mediaType) return false;
    if (query.productType && m.productType !== query.productType) return false;
    if (query.featured !== undefined && m.featured !== query.featured) return false;
    const at = new Date(m.timestamp);
    if (query.from && at < query.from) return false;
    if (query.to && at > query.to) return false;
    if (terms.length) {
      const haystack = `${m.displayTitle}\n${m.caption}\n${m.text}`.toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  if (query.sort === 'oldest') items = [...items].reverse();

  // The list is already in order, so a cursor is simply "everything after this post".
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  if (cursor) {
    const at = items.findIndex((m) => m._id === cursor.id);
    if (at !== -1) items = items.slice(at + 1);
  }

  const page = items.slice(0, query.limit);
  const hasMore = items.length > query.limit;
  const last = page.at(-1);
  return {
    items: page,
    meta: {
      limit: query.limit,
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last.timestamp, last._id) : null,
    },
  };
};

export const findArchiveMedia = (store: ArchiveStore, id: string): InstagramMediaDto | null =>
  store.media.find((m) => m._id === id) ?? null;

/** Same primary category first, then shared themes: newest first, as the database does. */
export const relatedArchiveMedia = (
  store: ArchiveStore,
  post: InstagramMediaDto,
  limit = 4,
): InstagramMediaDto[] => {
  const { primaryCategory, themes } = post.classification;
  return store.media
    .filter(
      (m) =>
        m._id !== post._id &&
        ((primaryCategory && m.classification.primaryCategory === primaryCategory) ||
          m.classification.themes.some((t) => themes.includes(t))),
    )
    .slice(0, limit);
};

/* ------------------------------------------------------------------- content */

/** What the owner supplied, over empty defaults for everything he has not. */
const filled = <T extends object>(defaults: T, supplied: Partial<T>): T => ({
  ...defaults,
  ...supplied,
});

const ABOUT_DEFAULTS: AboutDto = {
  displayName: 'Triyan',
  literaryIdentity: 'Triyan Writes',
  writingSince: '',
  body: '',
  statement: '',
  portraitUrl: '',
  links: { literaryInstagram: '', personalInstagram: '', email: '' },
};

export const archiveAbout = (): AboutDto => ({
  ...filled(ABOUT_DEFAULTS, SEED_ABOUT),
  links: filled(ABOUT_DEFAULTS.links, SEED_ABOUT.links),
});

const BOOK_DEFAULTS: BookDto = {
  title: 'Leaving and Living',
  subtitle: '',
  description: '',
  audience: '',
  salesLine: '',
  coverImageUrl: '',
  purchaseUrl: '',
  purchaseLinks: [],
  rating: null,
  publisher: '',
  isbn: '',
  price: '',
  publicationDate: null,
  formats: [],
  reviews: [],
  excerptSlugs: [],
  published: false,
};

export const archiveBook = (): BookDto => filled(BOOK_DEFAULTS, SEED_BOOK);

const ABYSS_DEFAULTS: AbyssDto = {
  name: 'ABYSS',
  tagline: '',
  philosophy: '',
  direction: '',
  comingSoonNote: '',
  published: true,
};

export const archiveAbyss = (): AbyssDto => filled(ABYSS_DEFAULTS, SEED_ABYSS);

const SETTINGS_DEFAULTS: SiteSettingsDto = {
  siteTitle: 'Triyan',
  tagline: '',
  defaultSeoDescription: '',
  defaultOgImageUrl: '',
  introEnabled: true,
  contactFormEnabled: false,
  contactDelivery: 'NONE',
};

/** With nowhere to keep a message, the contact form is closed and says so. */
export const archiveSettings = (): SiteSettingsDto => ({
  ...filled(SETTINGS_DEFAULTS, SEED_SETTINGS),
  contactFormEnabled: false,
  contactDelivery: 'NONE',
});
