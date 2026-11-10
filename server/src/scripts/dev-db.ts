/**
 * A real MongoDB for local development, with no Docker and no Atlas account.
 *
 *   npm run dev:db -w @triyan/server
 *
 * Boots mongod on a fixed port and stays in the foreground. Data lives in a temp
 * directory and does not survive a restart, which is correct for development: it
 * cannot be mistaken for production data, and no real writing is ever stored in it.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = Number(process.env.DEV_DB_PORT ?? 27017);

const main = async (): Promise<void> => {
  const mongo = await MongoMemoryServer.create({ instance: { port: PORT, dbName: 'triyan_dev' } });

  console.log(`\n  Development MongoDB listening on ${mongo.getUri()}`);
  console.log(`  Put this in server/.env:\n`);
  console.log(`    MONGODB_URI=mongodb://127.0.0.1:${PORT}\n`);
  console.log('  Data is in-memory and will be lost when this process stops.\n');

  const stop = () => {
    void mongo.stop().finally(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
