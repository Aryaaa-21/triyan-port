import mongoose, { ConnectionStates } from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true); // structural defence against query-operator injection

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
