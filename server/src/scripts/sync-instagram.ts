import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { getInstagramProvider } from '../services/instagram/index.js';
import { runSync } from '../services/instagram/sync.service.js';

/**
 * One-off sync: `npm run sync:instagram -w @triyan/server -- FULL`.
 * Uses whichever provider INSTAGRAM_PROVIDER selects. With `mock`, it stores
 * clearly-labelled synthetic posts for local development only.
 */
const mode = process.argv[2] === 'FULL' ? 'FULL' : 'INCREMENTAL';

const main = async () => {
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await connectDatabase();
  const provider = getInstagramProvider();
  console.log(`Syncing with the ${provider.name} provider (${mode})…`);
  const result = await runSync({ mode, provider });
  console.log(JSON.stringify(result, null, 2));
  await disconnectDatabase();
};

main().catch(async (error: unknown) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
