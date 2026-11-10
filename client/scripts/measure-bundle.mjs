/**
 * Reports the JavaScript each prerendered route actually ships, gzipped.
 *
 * The legacy polyfill chunk is reported separately: it is only fetched by browsers
 * that need it, so counting it against a modern-browser budget overstates the cost.
 *
 * Usage:  node scripts/measure-bundle.mjs [--json]
 * Run after `next build`. Phase 19 wires this into CI with failing thresholds.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const NEXT_DIR = join(import.meta.dirname, '..', '.next');
const APP_DIR = join(NEXT_DIR, 'server', 'app');

const htmlFiles = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
};

const routeName = (file) => {
  const rel = relative(APP_DIR, file)
    .split(sep)
    .join('/')
    .replace(/\.html$/, '');
  return rel === 'index' ? '/' : `/${rel}`;
};

const gzipOf = (publicPath) => {
  const file = join(NEXT_DIR, publicPath.replace('/_next/', ''));
  try {
    return gzipSync(readFileSync(file)).length;
  } catch {
    return 0;
  }
};

/**
 * The build manifest names the legacy polyfill chunk explicitly. Matching on the
 * filename does not work: Turbopack emits content-hashed names with no hint of
 * what a chunk holds.
 */
const polyfillChunks = new Set(
  (() => {
    try {
      const manifest = JSON.parse(readFileSync(join(NEXT_DIR, 'build-manifest.json'), 'utf8'));
      return (manifest.polyfillFiles ?? []).map((file) => `/_next/${file}`);
    } catch {
      return [];
    }
  })(),
);

const routes = [];

for (const file of htmlFiles(APP_DIR)) {
  const html = readFileSync(file, 'utf8');
  const scripts = [
    ...new Set([...html.matchAll(/src="(\/_next\/[^"]+\.js)"/g)].map((match) => match[1])),
  ];

  let modern = 0;
  let polyfill = 0;
  for (const script of scripts) {
    const size = gzipOf(script);
    if (polyfillChunks.has(script)) polyfill += size;
    else modern += size;
  }

  routes.push({ route: routeName(file), scripts: scripts.length, modern, polyfill });
}

routes.sort((a, b) => b.modern - a.modern);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(routes, null, 2));
} else {
  const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
  console.log('\nFirst-load JavaScript, gzipped\n');
  console.log(`${'route'.padEnd(26)}${'modern'.padStart(10)}${'polyfill'.padStart(12)}  scripts`);
  console.log('-'.repeat(60));
  for (const row of routes) {
    console.log(
      row.route.padEnd(26) +
        kb(row.modern).padStart(10) +
        kb(row.polyfill).padStart(12) +
        `  ${String(row.scripts).padStart(2)}`,
    );
  }
  const floor = Math.min(...routes.map((r) => r.modern));
  console.log('-'.repeat(60));
  console.log(`framework floor (smallest route): ${kb(floor)} gzip\n`);
}
