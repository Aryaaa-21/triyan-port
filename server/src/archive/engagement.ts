import { existsSync, readFileSync } from 'node:fs';
import type { WritingEngagement } from '@triyan/shared';
import { ARCHIVE_FILE_CANDIDATES } from './paths.js';

/**
 * How readers answered each writing on Instagram — likes, comments, shares and, for
 * reels, plays — taken from the archive file, where a daily job refreshes the numbers
 * (see docs/INSTAGRAM.md). The Most loved shelf ranks writings by `score`.
 *
 * It is read from the file in both modes, so the shelf works with or without a database.
 */

export interface PostEngagement {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  updatedAt?: string;
}

interface EngagementFile {
  posts: { code: string; engagement?: PostEngagement }[];
  writings?: { slug: string; sources?: string[] }[];
}

/** A comment or a share says more than a tap on the heart; plays count for a little. */
export const ENGAGEMENT_WEIGHTS = { like: 1, comment: 5, share: 3, view: 0.05 } as const;

export const engagementScore = (e: Omit<WritingEngagement, 'score' | 'updatedAt'>): number =>
  Math.round(
    e.likes * ENGAGEMENT_WEIGHTS.like +
      e.comments * ENGAGEMENT_WEIGHTS.comment +
      e.shares * ENGAGEMENT_WEIGHTS.share +
      e.views * ENGAGEMENT_WEIGHTS.view,
  );

/** Each writing's numbers, summed over the posts it was published in. */
export const buildEngagement = (file: EngagementFile): Map<string, WritingEngagement> => {
  const byCode = new Map(file.posts.map((p) => [p.code, p.engagement]));
  const out = new Map<string, WritingEngagement>();
  for (const w of file.writings ?? []) {
    const found = (w.sources ?? [])
      .map((code) => byCode.get(code))
      .filter((e): e is PostEngagement => Boolean(e));
    if (found.length === 0) continue;
    const sum = (key: 'likes' | 'comments' | 'shares' | 'views') =>
      found.reduce((total, e) => total + (e[key] ?? 0), 0);
    const counts = {
      likes: sum('likes'),
      comments: sum('comments'),
      shares: sum('shares'),
      views: sum('views'),
    };
    const score = engagementScore(counts);
    if (score <= 0) continue;
    const updatedAt =
      found
        .map((e) => e.updatedAt ?? '')
        .sort()
        .at(-1) ?? '';
    out.set(w.slug, { ...counts, score, updatedAt });
  }
  return out;
};

let cached: Map<string, WritingEngagement> | null = null;

/** Engagement by writing slug, read once per process. */
export const writingEngagement = (): Map<string, WritingEngagement> => {
  if (cached) return cached;
  const path = ARCHIVE_FILE_CANDIDATES.find(existsSync);
  cached = path
    ? buildEngagement(JSON.parse(readFileSync(path, 'utf8')) as EngagementFile)
    : new Map();
  return cached;
};

/** How many pieces the Most loved shelf holds. */
export const MOST_LOVED_LIMIT = 50;

/** The best-loved writings with known numbers, most loved first; the rest are left out. */
export const rankByEngagement = <T extends { slug: string }>(
  items: T[],
  engagement: Map<string, WritingEngagement>,
): (T & { engagement: WritingEngagement })[] =>
  items
    .filter((w) => engagement.has(w.slug))
    .map((w) => ({ ...w, engagement: engagement.get(w.slug)! }))
    .sort((a, b) => b.engagement.score - a.engagement.score)
    .slice(0, MOST_LOVED_LIMIT);
