import { describe, expect, it } from 'vitest';
import { buildEngagement, engagementScore, rankByEngagement } from './engagement.js';

describe('writing engagement', () => {
  const file = {
    posts: [
      {
        code: 'A',
        engagement: { likes: 100, comments: 10, shares: 5, views: 0, updatedAt: '2026-11-18' },
      },
      {
        code: 'B',
        engagement: { likes: 1000, comments: 2, shares: 0, views: 0, updatedAt: '2026-11-17' },
      },
      { code: 'C' },
    ],
    writings: [
      { slug: 'small', sources: ['A'] },
      { slug: 'big', sources: ['B'] },
      { slug: 'unknown', sources: ['C'] },
    ],
  };

  it('weights comments and shares above likes', () => {
    expect(engagementScore({ likes: 100, comments: 10, shares: 5, views: 0 })).toBe(165);
  });

  it('maps writings to their post numbers and skips those without any', () => {
    const map = buildEngagement(file);
    expect(map.get('small')?.score).toBe(165);
    expect(map.get('big')?.likes).toBe(1000);
    expect(map.has('unknown')).toBe(false);
  });

  it('ranks most loved first and leaves out writings with no numbers', () => {
    const ranked = rankByEngagement(
      [{ slug: 'small' }, { slug: 'unknown' }, { slug: 'big' }],
      buildEngagement(file),
    );
    expect(ranked.map((w) => w.slug)).toEqual(['big', 'small']);
  });
});
