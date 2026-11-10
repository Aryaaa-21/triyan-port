import express, { type Express, type RequestHandler } from 'express';
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
import { HttpError } from './utils/httpError.js';

/**
 * helmet, compression, cookie-parser and body-parser are typed against connect's
 * `IncomingMessage`/`ServerResponse` rather than Express 5's `Request`/`Response`.
 * They are wire-compatible; only the type declarations disagree, so we adapt them
 * in one place instead of scattering casts through the middleware chain.
 */
const connectMiddleware = (middleware: unknown): RequestHandler => middleware as RequestHandler;

/**
 * Middleware order is deliberate (ARCHITECTURE §6.3):
 * security -> identity -> observability -> throttling -> parsing -> routing -> errors.
 */
export const createApp = (): Express => {
  const app = express();

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

  const allowedOrigins = new Set([...env.CORS_ORIGINS, env.PUBLIC_SITE_URL]);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin and server-to-server requests send no Origin header.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        callback(HttpError.forbidden(`Origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
      maxAge: 86_400,
    }),
  );

  app.use(connectMiddleware(compression()));
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
