import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * A real MongoDB for integration tests.
 *
 * Not a mock: index behaviour, unique constraints, enum validation and the text
 * index are exactly the things worth testing, and a mocked driver proves none of
 * them. `mongodb-memory-server` runs a genuine mongod on a random port.
 */

let memory: MongoMemoryServer | null = null;

export const startTestDatabase = async (): Promise<string> => {
  memory ??= await MongoMemoryServer.create();
  const uri = memory.getUri();
  await mongoose.connect(uri, { dbName: 'triyan_test' });
  // Indexes are built explicitly so unique-constraint tests are deterministic.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
  return uri;
};

export const stopTestDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase().catch(() => undefined);
  await mongoose.disconnect();
  await memory?.stop();
  memory = null;
};

/** Leaves indexes in place; only the documents go. */
export const clearTestDatabase = async (): Promise<void> => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};
