import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** The archive file: beside the function on Vercel, beside this package elsewhere. */
export const ARCHIVE_FILE_CANDIDATES = [
  resolve(process.cwd(), 'server/data/instagram-archive.json'),
  resolve(process.cwd(), 'data/instagram-archive.json'),
  resolve(here, '../../data/instagram-archive.json'),
];
