import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { connectDatabase, ensureIndexes } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

/**
 * The same Express app as a serverless function (Vercel). The platform serves the
 * built site's files; this handles the API, /sitemap.xml, /robots.txt and every page
 * address, answering with the app's index.html (bundled with the function) and a real
 * 404 for pages that do not exist. The database connection opens on the first request
 * and is reused while the instance lives.
 */
const app = createApp({ clientDist: resolve(process.cwd(), 'client/dist') });

let ready: Promise<void> | null = null;
const prepare = (): Promise<void> =>
  (ready ??= (async () => {
    if (!env.MONGODB_URI) return;
    await connectDatabase();
    await ensureIndexes();
  })().catch((error: unknown) => {
    ready = null;
    logger.error({ err: error }, 'Database not ready');
  }));

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // A database failure is reported by the routes that need it (and by /readyz).
  await prepare();
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
