import { pino } from 'pino';
import { env, isDevelopment } from './env.js';

/** Structured JSON logs in production; readable logs locally. Secrets are redacted (spec §90). */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.accessToken',
      '*.refreshToken',
      '*.password',
      '*.INSTAGRAM_ACCESS_TOKEN',
      '*.INSTAGRAM_APP_SECRET',
      '*.MONGODB_URI',
    ],
    censor: '[redacted]',
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }
    : {}),
});

export const createChildLogger = (bindings: Record<string, unknown>) => logger.child(bindings);
