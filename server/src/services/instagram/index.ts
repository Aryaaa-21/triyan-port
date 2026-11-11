import { env, isProduction } from '../../config/env.js';
import { createGraphProvider } from './graph.provider.js';
import { createMockProvider } from './mock.provider.js';
import type { InstagramProvider } from './provider.js';

let override: InstagramProvider | null = null;

/** Tests and scripts inject a provider; the app reads it from configuration. */
export const setInstagramProvider = (provider: InstagramProvider | null): void => {
  override = provider;
};

export const getInstagramProvider = (): InstagramProvider => {
  if (override) return override;
  if (env.INSTAGRAM_PROVIDER === 'graph') return createGraphProvider(env.INSTAGRAM_ACCESS_TOKEN);
  // Mock data must never reach a production site.
  return createMockProvider({ configured: !isProduction });
};

/** Which stored posts the public may see: never mock posts in production. */
export const publicProviderFilter = (): Record<string, unknown> =>
  isProduction ? { provider: 'graph' } : {};

export * from './provider.js';
export { createGraphProvider } from './graph.provider.js';
export { createMockProvider, buildMockMedia } from './mock.provider.js';
