import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env, isProduction, isTest } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rootRouter } from './routes/index.js';
import { isSitePage } from './site-pages.js';
import { HttpError } from './utils/httpError.js';

/**
 * helmet, compression, cookie-parser and body-parser are typed against connect's
 * `IncomingMessage`/`ServerResponse` rather than Express 5's `Request`/`Response`.
 * They are wire-compatible; only the type declarations disagree, so we adapt them
 * in one place instead of scattering casts through the middleware chain.
 */
const connectMiddleware = (middleware: unknown): RequestHandler => middleware as RequestHandler;

/** client/dist, beside this package (the same relative path from src/ and dist/). */
const defaultClientDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');

/** The request's own origin: the site and the API share it. */
const ownOrigin = (req: Request) => `${req.protocol}://${req.get('host') ?? ''}`;

export interface AppOptions {
  /** The built website to serve. Defaults to CLIENT_DIST, then ../client/dist. */
  clientDist?: string;
}

/**
 * Middleware order is deliberate (ARCHITECTURE §6.3):
 * security -> static site -> identity -> observability -> throttling -> parsing ->
 * routing -> site fallback -> errors.
 */
export const createApp = (options: AppOptions = {}): Express => {
  const app = express();
  // Tests see a site only when they pass one in, never whatever happens to be built.
  const clientDist = options.clientDist ?? env.CLIENT_DIST ?? (isTest ? '' : defaultClientDist);
  const siteIndex = join(clientDist, 'index.html');
  const servesSite = clientDist !== '' && existsSync(siteIndex);

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Railway terminates TLS upstream
  app.set('query parser', 'extended');

  app.use(
    connectMiddleware(
      helmet({
        // The API serves JSON only; CSP for the site itself is set by Next.js.
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      }),
    ),
  );

  // The site's own pages may not be used by anyone else's (camera, microphone, location).
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(connectMiddleware(compression()));

  // The built website: fingerprinted assets are immutable; everything else revalidates.
  // Served before throttling, so a page's fonts and scripts never count as API calls.
  if (servesSite) {
    app.use(
      connectMiddleware(
        express.static(clientDist, {
          index: false,
          setHeaders: (res, path) => {
            res.setHeader(
              'cache-control',
              path.includes(`${join(clientDist, 'assets')}`)
                ? 'public, max-age=31536000, immutable'
                : 'public, max-age=3600',
            );
          },
        }),
      ),
    );
  }

  const allowedOrigins = new Set([...env.CORS_ORIGINS, env.PUBLIC_SITE_URL]);
  app.use(
    cors((req, callback) => {
      const origin = req.header('origin');
      // Same-origin requests (the site served from here) and server-to-server calls
      // are always allowed; other origins only when listed.
      const allowed = !origin || origin === ownOrigin(req as Request) || allowedOrigins.has(origin);
      if (!allowed) {
        callback(HttpError.forbidden(`Origin ${origin} is not allowed`));
        return;
      }
      callback(null, {
        origin: Boolean(origin),
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
        maxAge: 86_400,
      });
    }),
  );
  app.use(requestId);

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req as { id?: string }).id ?? '',
        autoLogging: { ignore: (req) => req.url === '/healthz' || req.url === '/readyz' },
      }),
    );
  }

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: isProduction ? 300 : 10_000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: (req) => req.path === '/healthz' || req.path === '/readyz',
      handler: (_req, _res, next) => next(HttpError.rateLimited()),
    }),
  );

  // express.json/urlencoded come from body-parser and are connect-typed too.
  app.use(connectMiddleware(express.json({ limit: '256kb' })));
  app.use(connectMiddleware(express.urlencoded({ extended: true, limit: '64kb' })));
  app.use(connectMiddleware(cookieParser()));

  app.use(rootRouter);

  // Every other page of the site is the React app; its router takes it from there.
  if (servesSite) {
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api/') || !req.accepts('html')) return next();
      // A missing page is still the app (it shows the site's 404), but with a 404 status.
      void isSitePage(req.path).then((known) => {
        res.status(known ? 200 : 404).setHeader('cache-control', 'no-cache');
        res.sendFile(siteIndex);
      }, next);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
