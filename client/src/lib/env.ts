import { z } from 'zod';

/**
 * Client-side configuration. Only `NEXT_PUBLIC_*` values reach the browser;
 * `API_BASE_URL` is read on the server during rendering and is never serialised
 * into the page.
 */
const serverSchema = z.object({
  API_BASE_URL: z.url().default('http://localhost:4000'),
  REVALIDATE_SECRET: z.string().min(16).optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().default('Triyan'),
});

// On Vercel, until a custom domain is configured, fall back to the project's production
// URL (a system variable Vercel exposes to Next.js projects) rather than localhost.
const vercelProductionUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelProductionUrl ? `https://${vercelProductionUrl}` : undefined),
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
});

export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
export const siteName = publicEnv.NEXT_PUBLIC_SITE_NAME;

/** Throws if called from the browser bundle. Server components and route handlers only. */
export const serverEnv = (): z.infer<typeof serverSchema> => {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() must not be called in the browser');
  }
  return serverSchema.parse({
    API_BASE_URL: process.env.API_BASE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  });
};
