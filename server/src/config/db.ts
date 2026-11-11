import mongoose from 'mongoose';

/**
 * `ConnectionStates` is a named export in mongoose's type declarations but not in its
 * ESM runtime build, so `import { ConnectionStates }` typechecks and then throws at
 * startup. It is reachable on the default export instead.
 */
const { ConnectionStates } = mongoose;
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

/**
 * `sanitizeFilter` is deliberately NOT enabled globally.
 *
 * It wraps any filter value containing a `$` key in `$eq`, indiscriminately — which
 * neuters the server's own operators as readily as a hostile one. It silently turned
 * the `bookExclusive: { $ne: true }` guard into a literal comparison, and would have
 * done the same to `$in`, `$all` and `$text`.
 *
 * Operator injection is prevented at the boundary instead, which is where it belongs:
 * every query parameter and request body is parsed by a zod schema before it reaches
 * a query, so only validated primitives and enum members are ever interpolated. No
 * raw `req.query` or `req.body` object is spread into a filter anywhere in this
 * codebase, and a test asserts that an injected operator is rejected.
 */

let connecting: Promise<typeof mongoose> | null = null;

export const connectDatabase = async (uri = env.MONGODB_URI): Promise<typeof mongoose> => {
  if (!uri) throw new Error('connectDatabase requires a MongoDB URI');
  if (mongoose.connection.readyState === ConnectionStates.connected) return mongoose;
  if (connecting) return connecting;

  connecting = mongoose
    .connect(uri, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
      retryWrites: true,
      autoIndex: env.NODE_ENV !== 'production', // production indexes are applied by a migration step
    })
    .then((connection) => {
      logger.info({ db: env.MONGODB_DB_NAME }, 'MongoDB connected');
      return connection;
    })
    .catch((error: unknown) => {
      connecting = null;
      logger.error({ err: error }, 'MongoDB connection failed');
      throw error;
    });

  return connecting;
};

/**
 * Builds any missing indexes for every registered model. Production turns autoIndex
 * off (an index build should never start implicitly on a live collection), so the API
 * calls this once at start instead. It only creates what is missing, never drops, and
 * is quick when everything already exists. Without it a fresh production database has
 * no text index (archive search fails) and no unique indexes (slugs, admin emails).
 */
export const ensureIndexes = async (): Promise<void> => {
  const names = mongoose.modelNames();
  await Promise.all(names.map((name) => mongoose.model(name).createIndexes()));
  logger.info({ models: names.length }, 'MongoDB indexes ensured');
};

export const disconnectDatabase = async (): Promise<void> => {
  connecting = null;
  if (mongoose.connection.readyState !== ConnectionStates.disconnected) await mongoose.disconnect();
};

export type DatabaseState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';

/** Mongoose also reports `99` (uninitialised), which we surface as disconnected. */
const READY_STATES: Readonly<Record<number, DatabaseState>> = {
  [ConnectionStates.disconnected]: 'disconnected',
  [ConnectionStates.connected]: 'connected',
  [ConnectionStates.connecting]: 'connecting',
  [ConnectionStates.disconnecting]: 'disconnecting',
};

export const databaseState = (): DatabaseState =>
  READY_STATES[mongoose.connection.readyState] ?? 'disconnected';
