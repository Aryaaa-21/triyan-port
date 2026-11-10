/// <reference types="vite/client" />
/**
 * Module-graph smoke test.
 *
 * Every server module must be *importable*, not merely type-correct. This exists
 * because `import { ConnectionStates } from 'mongoose'` typechecked cleanly and then
 * crashed the API at startup: the binding is present in mongoose's type declarations
 * but absent from its ESM runtime build. A type-only check cannot catch that class of
 * bug — only actually loading the module can.
 *
 * `import.meta.glob` is used rather than a dynamic `import()` with a variable path,
 * because a variable in an import specifier can only stand for one directory level
 * and this tree is nested.
 */
import { describe, expect, it } from 'vitest';

/**
 * Entry points run on import — they start listeners or, in the case of the CLI
 * scripts, parse arguments and exit. They are covered by the app suite and by being
 * run directly, not by this graph walk.
 */
const ENTRY_POINTS = ['/src/api.ts', '/src/worker.ts'];
const ENTRY_DIRECTORIES = ['/src/scripts/'];

const loaders = import.meta.glob('./src/**/*.ts');

const modules = Object.entries(loaders)
  .filter(([path]) => !path.endsWith('.test.ts'))
  .filter(([path]) => !ENTRY_POINTS.some((entry) => path.endsWith(entry)))
  .filter(([path]) => !ENTRY_DIRECTORIES.some((dir) => path.includes(dir)))
  .map(([path, load]) => [path.replace('./src/', '').replace(/\.ts$/, ''), load] as const)
  .sort(([a], [b]) => a.localeCompare(b));

describe('module graph', () => {
  it('discovered the server modules', () => {
    expect(modules.length).toBeGreaterThan(5);
  });

  it.each(modules)('%s imports at runtime', async (_name, load) => {
    await expect(load()).resolves.toBeDefined();
  });
});
