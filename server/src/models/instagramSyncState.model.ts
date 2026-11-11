import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SYNC_HEALTH_STATES, SYNC_MODES } from '@triyan/shared';

/** Singleton: the checkpoint and health of the Instagram sync. */

const runSchema = new Schema(
  {
    mode: { type: String, enum: SYNC_MODES },
    startedAt: Date,
    finishedAt: { type: Date, default: null },
    fetched: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    unchanged: { type: Number, default: 0 },
    markedUnavailable: { type: Number, default: 0 },
    pages: { type: Number, default: 0 },
    error: { type: String, default: null },
  },
  { _id: false },
);

const syncStateSchema = new Schema(
  {
    key: { type: String, default: 'instagram', unique: true },
    health: { type: String, enum: SYNC_HEALTH_STATES, default: 'NEVER_RUN' },
    /** A run lease, so two syncs never overlap. */
    lockedUntil: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null },
    lastAttemptAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    /** Newest post timestamp seen; incremental syncs stop once they pass it. */
    newestTimestamp: { type: Date, default: null },
    /** Paging cursor of an interrupted full sync, so it resumes instead of restarting. */
    resumeCursor: { type: String, default: null },
    rateLimitedUntil: { type: Date, default: null },
    /** When the current full sweep began; posts not seen since then have vanished upstream. */
    sweepStartedAt: { type: Date, default: null },
    lastRun: { type: runSchema, default: null },
  },
  { timestamps: true, versionKey: false },
);

export type InstagramSyncStateAttrs = InferSchemaType<typeof syncStateSchema>;

export const InstagramSyncState: Model<InstagramSyncStateAttrs> = model<InstagramSyncStateAttrs>(
  'InstagramSyncState',
  syncStateSchema,
);
