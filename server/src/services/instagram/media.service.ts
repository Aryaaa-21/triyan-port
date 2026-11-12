import { Types, type QueryFilter } from 'mongoose';
import type {
  ClassificationOverride,
  InstagramAdminUpdate,
  InstagramMediaDto,
  InstagramQuery,
  ReclassifyRequest,
  SyncStatusDto,
} from '@triyan/shared';
import {
  InstagramMedia,
  InstagramSyncState,
  type InstagramMediaAttrs,
} from '../../models/index.js';
import { classifySafely } from '../classifier/index.js';
import { hashCaption } from './sync.service.js';
import { getInstagramProvider, publicProviderFilter } from './index.js';

/* ---------------------------------------------------------------- cursors */

export const encodeCursor = (timestamp: Date, id: string): string =>
  Buffer.from(`${timestamp.toISOString()}|${id}`).toString('base64url');

export const decodeCursor = (cursor: string): { timestamp: Date; id: string } | null => {
  try {
    const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    const timestamp = new Date(iso ?? '');
    if (!id || !Types.ObjectId.isValid(id) || Number.isNaN(timestamp.getTime())) return null;
    return { timestamp, id };
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------- serialise */

type Lean = InstagramMediaAttrs & { _id: Types.ObjectId };

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export const toDto = (doc: Lean): InstagramMediaDto => ({
  _id: String(doc._id),
  sourceId: doc.sourceId,
  permalink: doc.permalink ?? '',
  mediaType: doc.mediaType,
  productType: doc.productType ?? 'UNKNOWN',
  caption: doc.caption ?? '',
  timestamp: new Date(doc.timestamp).toISOString(),
  mediaUrl: doc.mediaUrl ?? '',
  thumbnailUrl: doc.thumbnailUrl ?? '',
  mediaWidth: doc.mediaWidth ?? 0,
  mediaHeight: doc.mediaHeight ?? 0,
  children: (doc.children ?? []).map((c) => ({
    mediaType: c.mediaType ?? 'IMAGE',
    mediaUrl: c.mediaUrl ?? '',
    thumbnailUrl: c.thumbnailUrl ?? '',
    mediaWidth: c.mediaWidth ?? 0,
    mediaHeight: c.mediaHeight ?? 0,
  })),
  classification: {
    primaryCategory: doc.classification?.primaryCategory ?? null,
    secondaryCategories: doc.classification?.secondaryCategories ?? [],
    themes: doc.classification?.themes ?? [],
    emotions: doc.classification?.emotions ?? [],
    language: doc.classification?.language ?? 'UNKNOWN',
    confidence: doc.classification?.confidence ?? 0,
    needsReview: doc.classification?.needsReview ?? true,
    method: doc.classification?.method ?? 'RULES',
    classifierVersion: doc.classification?.classifierVersion ?? '',
    classifiedAt: iso(doc.classification?.classifiedAt),
  },
  manualOverride: doc.manualOverride ?? false,
  featured: doc.featured ?? false,
  hidden: doc.hidden ?? false,
  displayTitle: doc.displayTitle ?? '',
  altText: doc.altText ?? '',
  text: doc.text ?? '',
  explanation: doc.explanation ?? '',
  available: doc.available ?? true,
  provider: doc.provider,
  syncedAt: new Date(doc.syncedAt ?? doc.timestamp).toISOString(),
});

/* ----------------------------------------------------------------- query */

export const publicMediaFilter = (): QueryFilter<InstagramMediaAttrs> => ({
  hidden: false,
  available: true,
  ...publicProviderFilter(),
});

export const listMedia = async (
  query: InstagramQuery,
  base: QueryFilter<InstagramMediaAttrs> = publicMediaFilter(),
) => {
  const filter: QueryFilter<InstagramMediaAttrs> = { ...base };
  const categories = [...(query.category ? [query.category] : []), ...(query.categories ?? [])];
  if (categories.length) {
    filter.$or = [
      { 'classification.primaryCategory': { $in: categories } },
      { 'classification.secondaryCategories': { $in: categories } },
    ];
  }
  if (query.language) filter['classification.language'] = query.language;
  if (query.mediaType) filter.mediaType = query.mediaType;
  if (query.productType) filter.productType = query.productType;
  if (query.featured !== undefined) filter.featured = query.featured;
  if (query.from || query.to) {
    filter.timestamp = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }
  if (query.q) filter.$text = { $search: query.q };

  // `oldest` walks the same index in the other direction, so the cursor comparison flips too.
  const oldestFirst = query.sort === 'oldest';
  const past = oldestFirst ? '$gt' : '$lt';
  const direction = oldestFirst ? 1 : -1;

  if (query.cursor) {
    const c = decodeCursor(query.cursor);
    if (c) {
      const id = new Types.ObjectId(c.id);
      filter.$and = [
        {
          $or: [
            { timestamp: { [past]: c.timestamp } },
            { timestamp: c.timestamp, _id: { [past]: id } },
          ],
        },
      ];
    }
  }

  const docs = (await InstagramMedia.find(filter)
    .select('-corrections -captionHash')
    .sort({ timestamp: direction, _id: direction })
    .limit(query.limit + 1)
    .lean()) as Lean[];

  const hasMore = docs.length > query.limit;
  const page = docs.slice(0, query.limit);
  const last = page.at(-1);
  return {
    items: page.map(toDto),
    meta: {
      limit: query.limit,
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last.timestamp, String(last._id)) : null,
    },
  };
};

export const findPublicMedia = async (id: string): Promise<InstagramMediaDto | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = (await InstagramMedia.findOne({ _id: id, ...publicMediaFilter() })
    .select('-corrections -captionHash')
    .lean()) as Lean | null;
  return doc ? toDto(doc) : null;
};

/** Same primary category first, then shared themes. */
export const findRelatedMedia = async (dto: InstagramMediaDto, limit = 4) => {
  const { primaryCategory, themes } = dto.classification;
  if (!primaryCategory && themes.length === 0) return [];
  const docs = (await InstagramMedia.find({
    ...publicMediaFilter(),
    _id: { $ne: dto._id },
    $or: [
      ...(primaryCategory ? [{ 'classification.primaryCategory': primaryCategory }] : []),
      ...(themes.length ? [{ 'classification.themes': { $in: themes } }] : []),
    ],
  })
    .select('-corrections -captionHash')
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()) as Lean[];
  return docs.map(toDto);
};

/* ----------------------------------------------------------------- admin */

export const adminUpdateMedia = async (id: string, patch: InstagramAdminUpdate) => {
  const { linkedWriting: _ignored, ...fields } = patch;
  const doc = (await InstagramMedia.findByIdAndUpdate(
    id,
    { $set: fields },
    { returnDocument: 'after' },
  )
    .select('-captionHash')
    .lean()) as Lean | null;
  return doc ? toDto(doc) : null;
};

export const applyOverride = async (id: string, override: ClassificationOverride, by: string) => {
  const doc = await InstagramMedia.findById(id);
  if (!doc) return null;
  const before = doc.toObject().classification;
  const after = {
    primaryCategory: override.primaryCategory,
    secondaryCategories: override.secondaryCategories.filter((c) => c !== override.primaryCategory),
    themes: override.themes,
    emotions: override.emotions,
    language: override.language ?? doc.classification?.language ?? 'UNKNOWN',
    confidence: 1,
    needsReview: false,
    method: 'MANUAL' as const,
    classifierVersion: 'manual',
    classifiedAt: new Date(),
  };
  doc.classification = after;
  doc.manualOverride = true;
  doc.corrections.push({ at: new Date(), by, before, after, note: override.note ?? '' });
  await doc.save();
  return toDto(doc.toObject());
};

export const reclassify = async (request: ReclassifyRequest) => {
  const filter: QueryFilter<InstagramMediaAttrs> = {};
  if (request.scope === 'SELECTED') filter._id = { $in: request.ids };
  if (request.scope === 'NEEDS_REVIEW') filter['classification.needsReview'] = true;
  if (!request.includeManualOverrides) filter.manualOverride = { $ne: true };
  // Archive posts were sorted by reading the image, which the caption rules cannot do.
  filter.provider = { $ne: 'archive' };

  let count = 0;
  for await (const doc of InstagramMedia.find(filter).cursor()) {
    doc.classification = { ...classifySafely(doc.caption ?? ''), classifiedAt: new Date() };
    if (request.includeManualOverrides) doc.manualOverride = false;
    await doc.save();
    count += 1;
  }
  return { reclassified: count };
};

/** Re-fetches one post's metadata from the provider. Marks it unavailable if it vanished. */
export const refreshMedia = async (id: string) => {
  const doc = await InstagramMedia.findById(id);
  if (!doc) return null;
  // Archive posts have no upstream to ask: asking would wrongly mark them as vanished.
  if (doc.provider === 'archive') return toDto(doc.toObject());
  const provider = getInstagramProvider();
  try {
    const fresh = await provider.fetchOne(doc.sourceId);
    const captionChanged = hashCaption(fresh.caption) !== doc.captionHash;
    Object.assign(doc, {
      permalink: fresh.permalink,
      caption: fresh.caption,
      captionHash: hashCaption(fresh.caption),
      mediaType: fresh.mediaType,
      productType: fresh.productType,
      mediaUrl: fresh.mediaUrl,
      thumbnailUrl: fresh.thumbnailUrl,
      children: fresh.children,
      available: true,
      unavailableSince: null,
      syncedAt: new Date(),
    });
    if (captionChanged && !doc.manualOverride) {
      doc.classification = { ...classifySafely(fresh.caption), classifiedAt: new Date() };
    }
  } catch (error) {
    if ((error as { kind?: string }).kind !== 'NOT_FOUND') throw error;
    doc.available = false;
    doc.unavailableSince = new Date();
  }
  await doc.save();
  return toDto(doc.toObject());
};

export const getSyncStatus = async (): Promise<SyncStatusDto> => {
  const provider = getInstagramProvider();
  const [state, totalStored, archiveStored] = await Promise.all([
    InstagramSyncState.findOne({ key: 'instagram' }).lean(),
    InstagramMedia.countDocuments({ provider: provider.name }),
    InstagramMedia.countDocuments({ provider: 'archive' }),
  ]);
  const run = state?.lastRun;
  return {
    provider: provider.name,
    archiveStored,
    configured: provider.configured,
    health: state?.health ?? 'NEVER_RUN',
    lastSuccessAt: iso(state?.lastSuccessAt),
    lastAttemptAt: iso(state?.lastAttemptAt),
    lastError: state?.lastError ?? null,
    newestTimestamp: iso(state?.newestTimestamp),
    resumeCursor: state?.resumeCursor ?? null,
    rateLimitedUntil: iso(state?.rateLimitedUntil),
    totalStored,
    lastRun:
      run && run.mode && run.startedAt
        ? {
            mode: run.mode,
            startedAt: new Date(run.startedAt).toISOString(),
            finishedAt: iso(run.finishedAt),
            fetched: run.fetched ?? 0,
            created: run.created ?? 0,
            updated: run.updated ?? 0,
            unchanged: run.unchanged ?? 0,
            markedUnavailable: run.markedUnavailable ?? 0,
            pages: run.pages ?? 0,
            error: run.error ?? null,
          }
        : null,
  };
};
