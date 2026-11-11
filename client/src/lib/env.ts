/**
 * Site configuration for the browser. Vite inlines `VITE_*` values at build time; the
 * site URL falls back to wherever the site is being served from.
 */
const configuredUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();

export const siteUrl = (
  configuredUrl ||
  (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin)
).replace(/\/$/, '');

export const siteName = (import.meta.env.VITE_SITE_NAME as string | undefined) || 'Triyan';
