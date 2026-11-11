import { createHash } from 'node:crypto';
import type { SyncMode } from '@triyan/shared';
import { InstagramMedia, InstagramSyncState } from '../../models/index.js';
import { classifySafely } from '../classifier/index.js';
import { ProviderError, type InstagramProvider, type ProviderMedia } from './provider.js';

export interface SyncOptions {
  mode: SyncMode;
  provider: InstagramProvider;
  pageSize?: number;
  maxPages?: number;
  retries?: number;
  /** Injected so tests do not wait on real backoff. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
}

export interface SyncResult {
  status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'FAILED';
  reason?: string;
  mode: SyncMode;
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  markedUnavailable: number;
  pages: number;
}

const LOCK_MS = 15 * 60 * 1000;
const KEY = 'instagram';

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const hashCaption = (caption: string): string =>
  createHash('sha256').update(caption).digest('hex').slice(0, 32);

const ensureState = async () => {
  await InstagramSyncState.updateOne(
    { key: KEY },
    { $setOnInsert: { key: KEY } },
    { upsert: true },
  );
};

/** Acquires the run lease, or returns null when another sync holds it. */
const acquireLock = async (now: Date) => {
  await ensureState();
  return InstagramSyncState.findOneAndUpdate(
    { key: KEY, $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }] },
    {
      $set: {
        lockedUntil: new Date(now.getTime() + LOCK_MS),
        lastAttemptAt: now,
        health: 'RUNNING',
      },
    },
    { returnDocument: 'after' },
  );
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  sleep: (ms: number) => Promise<void>,
): Promise<T> => {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof ProviderError) || !error.transient || attempt >= retries) throw error;
      await sleep(500 * 2 ** attempt);
      attempt += 1;
    }
  }
};

type Outcome = 'created' | 'updated' | 'unchanged';

const upsertOne = async (
  item: ProviderMedia,
  provider: 'graph' | 'mock',
  now: Date,
): Promise<Outcome> => {
  const captionHash = hashCaption(item.caption);
  const existing = await InstagramMedia.findOne({ sourceId: item.sourceId });

  if (!existing) {
    const c = classifySafely(item.caption);
    try {
      await InstagramMedia.create({
        ...item,
        provider,
        captionHash,
        classification: { ...c, classifiedAt: now },
        syncedAt: now,
      });
      return 'created';
    } catch (error) {
      // A concurrent writer inserted it first; the unique index deduplicates.
      if ((error as { code?: number }).code === 11000) return 'unchanged';
      throw error;
    }
  }

  const changed =
    existing.captionHash !== captionHash ||
    existing.permalink !== item.permalink ||
    existing.mediaUrl !== item.mediaUrl ||
    existing.thumbnailUrl !== item.thumbnailUrl ||
    existing.mediaType !== item.mediaType ||
    existing.productType !== item.productType ||
    !existing.available;

  existing.syncedAt = now;
  if (!existing.available) {
    existing.available = true;
    existing.unavailableSince = null;
  }

  if (!changed) {
    await existing.save();
    return 'unchanged';
  }

  const captionChanged = existing.captionHash !== captionHash;
  Object.assign(existing, {
    permalink: item.permalink,
    mediaType: item.mediaType,
    productType: item.productType,
    caption: item.caption,
    captionHash,
    timestamp: item.timestamp,
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl,
    children: item.children,
  });
  // An admin's correction outranks the classifier, even when the caption is edited.
  if (captionChanged && !existing.manualOverride) {
    existing.classification = { ...classifySafely(item.caption), classifiedAt: now };
  }
  await existing.save();
  return 'updated';
};

export const runSync = async (options: SyncOptions): Promise<SyncResult> => {
  const {
    mode,
    provider,
    pageSize = 50,
    maxPages = 500,
    retries = 3,
    sleep = defaultSleep,
    now: clock = () => new Date(),
  } = options;
  const startedAt = clock();
  const result: SyncResult = {
    status: 'COMPLETED',
    mode,
    fetched: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    markedUnavailable: 0,
    pages: 0,
  };

  if (!provider.configured) {
    await ensureState();
    await InstagramSyncState.updateOne(
      { key: KEY },
      {
        $set: {
          health: 'FAILED',
          lastAttemptAt: startedAt,
          lastError: 'MISSING_CREDENTIALS: the Instagram provider is not configured',
        },
      },
    );
    return { ...result, status: 'SKIPPED', reason: 'MISSING_CREDENTIALS' };
  }

  const state = await acquireLock(startedAt);
  if (!state) return { ...result, status: 'SKIPPED', reason: 'LOCKED' };

  if (state.rateLimitedUntil && state.rateLimitedUntil > startedAt) {
    await InstagramSyncState.updateOne(
      { key: KEY },
      { $set: { lockedUntil: null, health: 'DEGRADED' } },
    );
    return { ...result, status: 'SKIPPED', reason: 'RATE_LIMITED' };
  }

  // Incremental with no history is a full sync.
  const effectiveMode: SyncMode = mode === 'INCREMENTAL' && !state.newestTimestamp ? 'FULL' : mode;
  result.mode = effectiveMode;
  const previousNewest = state.newestTimestamp;
  let cursor = effectiveMode === 'FULL' ? (state.resumeCursor ?? null) : null;
  const sweepStartedAt =
    effectiveMode === 'FULL'
      ? cursor && state.sweepStartedAt
        ? state.sweepStartedAt
        : startedAt
      : null;
  if (effectiveMode === 'FULL') {
    await InstagramSyncState.updateOne({ key: KEY }, { $set: { sweepStartedAt } });
  }

  let newest = previousNewest;
  let finished = false;
  const update: Record<string, unknown> = {};

  try {
    while (result.pages < maxPages) {
      const page = await withRetry(() => provider.fetchPage(cursor, pageSize), retries, sleep);
      result.pages += 1;
      result.fetched += page.items.length;

      let reachedKnown = false;
      for (const item of page.items) {
        const outcome = await upsertOne(item, provider.name, clock());
        result[outcome] += 1;
        if (!newest || item.timestamp > newest) newest = item.timestamp;
        if (previousNewest && item.timestamp <= previousNewest) reachedKnown = true;
      }

      cursor = page.nextCursor;
      if (effectiveMode === 'FULL') {
        // Checkpoint after every page so an interrupted sweep resumes here.
        await InstagramSyncState.updateOne(
          { key: KEY },
          { $set: { resumeCursor: cursor, newestTimestamp: newest } },
        );
      }
      if (!cursor || (effectiveMode === 'INCREMENTAL' && reachedKnown)) {
        finished = true;
        break;
      }
    }

    if (effectiveMode === 'FULL' && finished && sweepStartedAt) {
      const gone = await InstagramMedia.updateMany(
        { provider: provider.name, available: true, syncedAt: { $lt: sweepStartedAt } },
        { $set: { available: false, unavailableSince: clock() } },
      );
      result.markedUnavailable = gone.modifiedCount;
    }

    if (!finished) result.status = 'PARTIAL';
    Object.assign(update, {
      health: finished ? 'HEALTHY' : 'DEGRADED',
      lastSuccessAt: clock(),
      lastError: finished ? null : `Stopped after ${maxPages} pages; will resume`,
      newestTimestamp: newest,
      rateLimitedUntil: null,
      ...(effectiveMode === 'FULL' && finished ? { resumeCursor: null, sweepStartedAt: null } : {}),
    });
  } catch (error) {
    const e =
      error instanceof ProviderError
        ? error
        : new ProviderError(
            'UNAVAILABLE',
            error instanceof Error ? error.message : 'Unknown error',
          );
    result.status = result.pages > 0 ? 'PARTIAL' : 'FAILED';
    result.reason = e.kind;
    Object.assign(update, {
      lastError: `${e.kind}: ${e.message}`,
      newestTimestamp: newest,
      health:
        e.kind === 'TOKEN_EXPIRED'
          ? 'TOKEN_EXPIRED'
          : e.kind === 'INVALID_TOKEN' || e.kind === 'MISSING_CREDENTIALS'
            ? 'FAILED'
            : 'DEGRADED',
      ...(e.kind === 'RATE_LIMITED'
        ? { rateLimitedUntil: new Date(clock().getTime() + (e.retryAfterMs ?? 3_600_000)) }
        : {}),
    });
  } finally {
    await InstagramSyncState.updateOne(
      { key: KEY },
      {
        $set: {
          ...update,
          lockedUntil: null,
          lastRun: {
            mode: result.mode,
            startedAt,
            finishedAt: clock(),
            fetched: result.fetched,
            created: result.created,
            updated: result.updated,
            unchanged: result.unchanged,
            markedUnavailable: result.markedUnavailable,
            pages: result.pages,
            error: result.reason ?? null,
          },
        },
      },
    );
  }

  return result;
};
