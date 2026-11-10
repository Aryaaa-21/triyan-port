import next from 'eslint-config-next';

/**
 * `eslint-config-next` v16 exports a flat-config array (next, next/typescript, settings).
 *
 * Only non-type-aware rules are added here: Next ships its own parser, which does not
 * forward `parserOptions.project` to @typescript-eslint, so any rule needing type
 * information throws. The client's type safety comes from `npm run typecheck`
 * (`tsc --noEmit`) instead; the shared and server workspaces do run fully
 * type-checked linting from the root config.
 */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...next,
  {
    files: ['**/*.{ts,tsx,mts,mjs}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];

export default config;
