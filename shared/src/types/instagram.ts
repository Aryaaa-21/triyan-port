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
  children: { mediaType: InstagramMediaType; mediaUrl: string; thumbnailUrl: string }[];
  classification: ClassificationDto;
  manualOverride: boolean;
  featured: boolean;
  hidden: boolean;
  displayTitle: string;
  altText: string;
  available: boolean;
  provider: 'graph' | 'mock';
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
