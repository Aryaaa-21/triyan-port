import { z } from 'zod';

/**
 * The server refuses to boot with a missing or malformed secret rather than failing
 * mysteriously at the first request (ARCHITECTURE §11). Nothing in the codebase reads
 * `process.env` directly — everything imports `env` from here.
 */

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    MONGODB_URI: z.string().min(1).optional(),
    MONGODB_DB_NAME: z.string().min(1).default('triyan_dev'),

    /** Origins permitted to call the API with credentials. Comma-separated. */
    CORS_ORIGINS: csv,
    PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),

    /** ISR invalidation hook on the Next.js app (ARCHITECTURE §2.3). */
    REVALIDATE_URL: z.url().optional(),
    REVALIDATE_SECRET: z.string().min(16).optional(),

    /** Which Instagram provider to use. `mock` never touches the network (spec §55). */
    INSTAGRAM_PROVIDER: z.enum(['graph', 'mock']).default('mock'),
    INSTAGRAM_APP_ID: z.string().optional(),
    INSTAGRAM_APP_SECRET: z.string().optional(),
    INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
    INSTAGRAM_ACCOUNT_USERNAME: z.string().default('triyanwrites'),

    MEDIA_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    SYNC_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SYNC_CRON: z.string().default('*/30 * * * *'),
  })
  .superRefine((value, ctx) => {
    const require = (field: keyof typeof value, reason: string) => {
      if (!value[field]) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: `${String(field)} is required ${reason}`,
        });
      }
    };

    // Production must never boot without a database. Development and test may:
    // it lets the API shell run with no infrastructure at all, and /readyz
    // reports the degraded state honestly rather than pretending to be healthy.
    if (value.NODE_ENV === 'production') require('MONGODB_URI', 'to connect to MongoDB');

    if (value.INSTAGRAM_PROVIDER === 'graph') {
      require('INSTAGRAM_APP_ID', 'when INSTAGRAM_PROVIDER=graph');
      require('INSTAGRAM_APP_SECRET', 'when INSTAGRAM_PROVIDER=graph');
      require('INSTAGRAM_ACCESS_TOKEN', 'when INSTAGRAM_PROVIDER=graph');
    }

    if (value.MEDIA_PROVIDER === 'cloudinary') {
      require('CLOUDINARY_CLOUD_NAME', 'when MEDIA_PROVIDER=cloudinary');
      require('CLOUDINARY_API_KEY', 'when MEDIA_PROVIDER=cloudinary');
      require('CLOUDINARY_API_SECRET', 'when MEDIA_PROVIDER=cloudinary');
    }
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  · ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  // Deliberately not the logger: the logger itself depends on a valid env.
  console.error(`\nInvalid environment configuration:\n${lines.join('\n')}\n`);
  throw new Error('Invalid environment configuration');
}

export const env: Env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
