import { describe, expect, it } from 'vitest';
import { instagramQuerySchema, writingQuerySchema } from '@triyan/shared';
import {
  archiveId,
  archiveSettings,
  buildStore,
  findArchiveMedia,
  listArchiveMedia,
  listArchiveWritings,
  relatedArchiveWritings,
  type ArchiveFile,
} from './store.js';

const slide = {
  url: '/archive/instagram/a-1.webp',
  thumbUrl: '/archive/instagram/a-1.thumb.webp',
  width: 1000,
  height: 1250,
};

const file: ArchiveFile = {
  classifierVersion: 'test',
  posts: [
    {
      code: 'AAA',
      kind: 'reel',
      timestamp: '2026-01-01T00:00:00Z',
      caption: 'first',
      text: 'the moon',
      slides: [slide],
      classification: {
        primaryCategory: 'LOVE_LONGING',
        themes: ['love'],
        language: 'ENGLISH',
        confidence: 0.9,
      },
    },
    {
      code: 'BBB',
      kind: 'post',
      timestamp: '2026-02-01T00:00:00Z',
      caption: 'second',
      slides: [slide, slide],
      classification: {
        primaryCategory: 'GRIEF_MELANCHOLY',
        secondaryCategories: ['LOVE_LONGING'],
        confidence: 0.4,
      },
    },
    {
      code: 'CCC',
      kind: 'post',
      timestamp: '2026-03-01T00:00:00Z',
      caption: 'third',
      slides: [slide],
      classification: { primaryCategory: 'HOPE_DESPAIR' },
    },
    {
      code: 'HID',
      kind: 'post',
      timestamp: '2026-04-01T00:00:00Z',
      caption: 'hidden',
      hidden: true,
      slides: [slide],
      classification: { primaryCategory: 'HOPE_DESPAIR' },
    },
  ],
  writings: [
    {
      slug: 'one',
      title: 'One',
      content: 'a line about the moon\nand another',
      publishedAt: '2026-01-01T00:00:00Z',
      primaryCategory: 'LOVE_LONGING',
      themes: ['love'],
      language: 'ENGLISH',
    },
    {
      slug: 'two',
      title: 'Two',
      content: 'grief',
      publishedAt: '2026-02-01T00:00:00Z',
      primaryCategory: 'GRIEF_MELANCHOLY',
      secondaryCategories: ['LOVE_LONGING'],
      themes: ['love'],
      language: 'ENGLISH',
    },
    {
      slug: 'three',
      title: 'Three',
      content: 'hope',
      publishedAt: '2026-03-01T00:00:00Z',
      primaryCategory: 'HOPE_DESPAIR',
    },
  ],
};

const store = buildStore(file);
const wq = (q: Record<string, unknown> = {}) => writingQuerySchema.parse(q);
const iq = (q: Record<string, unknown> = {}) => instagramQuerySchema.parse(q);

describe('the archive store', () => {
  it('lists writings newest first, pages them and counts them', () => {
    const page = listArchiveWritings(store, wq({ limit: 2 }));
    expect(page.items.map((w) => w.slug)).toEqual(['three', 'two']);
    expect(page).toMatchObject({ total: 3, totalPages: 2, page: 1 });
    expect(listArchiveWritings(store, wq({ limit: 2, page: 2 })).items.map((w) => w.slug)).toEqual([
      'one',
    ]);
  });

  it('files a writing on a shelf by its primary or secondary category', () => {
    const shelf = listArchiveWritings(store, wq({ category: 'LOVE_LONGING' }));
    expect(shelf.items.map((w) => w.slug)).toEqual(['two', 'one']);
  });

  it('searches the title and the text, and can read from the beginning', () => {
    expect(listArchiveWritings(store, wq({ q: 'MOON' })).items.map((w) => w.slug)).toEqual(['one']);
    expect(listArchiveWritings(store, wq({ sort: 'oldest' })).items[0]?.slug).toBe('one');
  });

  it('gives every writing an excerpt and published status', () => {
    const [w] = listArchiveWritings(store, wq({ q: 'moon' })).items;
    expect(w).toMatchObject({ status: 'PUBLISHED', excerpt: 'a line about the moon and another' });
  });

  it('relates writings that share a shelf or a theme, never the piece itself', () => {
    const one = store.writings.find((w) => w.slug === 'one')!;
    expect(relatedArchiveWritings(store, one).map((w) => w.slug)).toEqual(['two']);
  });

  it('never serves a hidden post, and walks the rest with a cursor in both directions', () => {
    expect(store.media.map((m) => m.sourceId)).toEqual(['CCC', 'BBB', 'AAA']);
    const first = listArchiveMedia(store, iq({ limit: 2 }));
    expect(first.items.map((m) => m.sourceId)).toEqual(['CCC', 'BBB']);
    expect(first.meta.hasMore).toBe(true);
    const second = listArchiveMedia(store, iq({ limit: 2, cursor: first.meta.nextCursor }));
    expect(second.items.map((m) => m.sourceId)).toEqual(['AAA']);
    expect(second.meta).toMatchObject({ hasMore: false, nextCursor: null });
    expect(listArchiveMedia(store, iq({ sort: 'oldest', limit: 1 })).items[0]?.sourceId).toBe(
      'AAA',
    );
  });

  it('shapes a post like the database does: stable id, reel filter, carousel slides, review flag', () => {
    const reel = listArchiveMedia(store, iq({ productType: 'REELS' })).items;
    expect(reel.map((m) => m.sourceId)).toEqual(['AAA']);
    expect(reel[0]).toMatchObject({
      _id: archiveId('AAA'),
      provider: 'archive',
      mediaType: 'IMAGE',
      text: 'the moon',
    });
    expect(archiveId('AAA')).toMatch(/^[0-9a-f]{24}$/);
    const carousel = findArchiveMedia(store, archiveId('BBB'));
    expect(carousel).toMatchObject({ mediaType: 'CAROUSEL_ALBUM' });
    expect(carousel?.children).toHaveLength(2);
    expect(carousel?.classification.needsReview).toBe(true);
    expect(findArchiveMedia(store, archiveId('HID'))).toBeNull();
  });

  it('closes the contact form, since there is nowhere to keep a message', () => {
    expect(archiveSettings()).toMatchObject({ contactFormEnabled: false, contactDelivery: 'NONE' });
  });
});
