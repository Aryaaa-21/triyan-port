#!/usr/bin/env node
/**
 * First-load JavaScript of the built site, gzipped: the entry script and the chunks it
 * preloads (what every visitor downloads before the first page shows). Run after
 * `vite build`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = join(import.meta.dirname, '..', 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const scripts = [
  ...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((match) => match[1])),
];
let total = 0;
for (const path of scripts) {
  const size = gzipSync(readFileSync(join(dist, path))).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KB  ${path}`);
}
console.log(`${(total / 1024).toFixed(1).padStart(7)} KB  first-load JavaScript (gzip)`);
