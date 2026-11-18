/**
 * Merges fresh Instagram numbers into the archive file.
 *
 *   npm run apply:engagement -w @triyan/server -- <engagement.json>
 *
 * The input maps each post's shortcode to { likes, comments, shares, views, at }, as
 * written by the scan tool's engagement.js. Posts missing from it keep their numbers;
 * a count Instagram did not show (null) keeps the last one known.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ARCHIVE_FILE_CANDIDATES } from '../archive/paths.js';

type Counts = {
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
  at?: string;
};

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run apply:engagement -w @triyan/server -- <engagement.json>');
  process.exit(1);
}
const path = ARCHIVE_FILE_CANDIDATES.find(existsSync);
if (!path) throw new Error('archive file not found');

const fresh = JSON.parse(readFileSync(input, 'utf8')) as Record<string, Counts>;
const archive = JSON.parse(readFileSync(path, 'utf8')) as {
  posts: { code: string; engagement?: Record<string, number | string> }[];
};

let updated = 0;
for (const post of archive.posts) {
  const c = fresh[post.code];
  if (!c) continue;
  const prev = post.engagement ?? {};
  const pick = (key: 'likes' | 'comments' | 'shares' | 'views'): number => {
    const value = c[key];
    return typeof value === 'number' ? value : ((prev[key] as number | undefined) ?? 0);
  };
  post.engagement = {
    likes: pick('likes'),
    comments: pick('comments'),
    shares: pick('shares'),
    views: pick('views'),
    updatedAt: c.at ?? new Date().toISOString(),
  };
  updated++;
}

writeFileSync(path, JSON.stringify(archive, null, 1) + '\n');
console.log(`engagement: ${updated} of ${archive.posts.length} posts updated`);
