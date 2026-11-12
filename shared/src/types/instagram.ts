import type {
  CategoryKey,
  ClassificationMethod,
  EmotionKey,
  InstagramMediaType,
  InstagramProductType,
  LanguageKey,
  SyncHealthState,
  SyncMode,
  ThemeKey,
} from '../taxonomy.js';

/**
 * Where a stored post came from. `graph` and `mock` are sync providers; `archive` is the
 * owner's own screenshot archive, imported once by script and never touched by a sync.
 */
export type InstagramProviderName = 'graph' | 'mock' | 'archive';

/** The classification attached to a synced post. */
export interface ClassificationDto {
  primaryCategory: CategoryKey | null;
  secondaryCategories: CategoryKey[];
  themes: ThemeKey[];
  emotions: EmotionKey[];
  language: LanguageKey;
  confidence: number;
  needsReview: boolean;
  method: ClassificationMethod;
  classifierVersion: string;
  classifiedAt: string | null;
}

/** A synced Instagram post as the public API serialises it. */
export interface InstagramMediaDto {
  _id: string;
  sourceId: string;
  permalink: string;
  mediaType: InstagramMediaType;
  productType: InstagramProductType;
  caption: string;
  timestamp: string;
  mediaUrl: string;
  thumbnailUrl: string;
  /** Pixel size of `mediaUrl`, when known (0 when not). Lets a tile keep the image's own shape. */
  mediaWidth: number;
  mediaHeight: number;
  children: {
    mediaType: InstagramMediaType;
    mediaUrl: string;
    thumbnailUrl: string;
    mediaWidth: number;
    mediaHeight: number;
  }[];
  classification: ClassificationDto;
  manualOverride: boolean;
  featured: boolean;
  hidden: boolean;
  displayTitle: string;
  altText: string;
  /** The writing inside the image, typed out; '' when there is none. Slides are split by a `---` line. */
  text: string;
  /** The piece in the simplest words: the archive's reading, not the author's. */
  explanation: string;
  available: boolean;
  provider: InstagramProviderName;
  syncedAt: string;
}

export interface SyncRunDto {
  mode: SyncMode;
  startedAt: string;
  finishedAt: string | null;
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  markedUnavailable: number;
  pages: number;
  error: string | null;
}

export interface SyncStatusDto {
  provider: 'graph' | 'mock';
  /** Posts imported from the owner's own screenshots, outside any sync. */
  archiveStored: number;
  configured: boolean;
  health: SyncHealthState;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  newestTimestamp: string | null;
  resumeCursor: string | null;
  rateLimitedUntil: string | null;
  totalStored: number;
  lastRun: SyncRunDto | null;
}
