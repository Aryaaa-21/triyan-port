import { ProviderError, type InstagramProvider, type ProviderMedia } from './provider.js';

/**
 * A development and test provider. It never touches the network.
 *
 * Its captions are deliberately synthetic and labelled `[mock]`, so a mock post can
 * never be mistaken for Triyan's work. Mock data is never served in production
 * (see `publicProviderFilter`).
 */

export interface MockOptions {
  items?: ProviderMedia[];
  /** Fail the Nth call to fetchPage (1-based) with this error. */
  failOn?: { call: number; error: ProviderError };
  configured?: boolean;
}

const MOCK_CAPTIONS = [
  '[mock] a fixture about love and longing — I miss you, waiting',
  '[mock] fixture: grief and tears, mourning the absence',
  '[mock] fixture text on existence, meaning and the void',
  '[mock] तन्हाई और यादें, रात भर दर्द रहा',
  '[mock] fixture: dil mein dard hai, tum nahi ho',
  '[mock] fixture about hope after despair',
  '[mock] fixture: death, mortality, ashes and dust',
  '[mock]',
  '',
  '[mock] fixture on time and memory, those days back then',
];

export const buildMockMedia = (count: number): ProviderMedia[] =>
  Array.from({ length: count }, (_, i) => {
    const n = count - i; // newest first
    const reel = n % 4 === 0;
    return {
      sourceId: `mock_${String(n).padStart(4, '0')}`,
      permalink: `https://www.instagram.com/p/mock${n}/`,
      mediaType: reel ? 'VIDEO' : n % 5 === 0 ? 'CAROUSEL_ALBUM' : 'IMAGE',
      productType: reel ? 'REELS' : 'FEED',
      caption: MOCK_CAPTIONS[n % MOCK_CAPTIONS.length] ?? '',
      timestamp: new Date(Date.UTC(2024, 0, 1) + n * 86_400_000),
      mediaUrl: '',
      thumbnailUrl: '',
      children: [],
    };
  });

export const createMockProvider = (
  options: MockOptions = {},
): InstagramProvider & {
  items: ProviderMedia[];
  calls: number;
} => {
  const state = {
    items: options.items ?? buildMockMedia(30),
    calls: 0,
  };

  return {
    name: 'mock',
    configured: options.configured ?? true,
    get items() {
      return state.items;
    },
    set items(value) {
      state.items = value;
    },
    get calls() {
      return state.calls;
    },

    fetchPage(cursor, limit) {
      state.calls += 1;
      if (options.failOn && options.failOn.call === state.calls) {
        return Promise.reject(options.failOn.error);
      }
      const sorted = [...state.items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const start = cursor ? Number(cursor) : 0;
      const items = sorted.slice(start, start + limit);
      const next = start + limit;
      return Promise.resolve({ items, nextCursor: next < sorted.length ? String(next) : null });
    },

    fetchOne(sourceId) {
      const found = state.items.find((i) => i.sourceId === sourceId);
      if (!found)
        return Promise.reject(new ProviderError('NOT_FOUND', `No mock media ${sourceId}`));
      return Promise.resolve(found);
    },
  };
};
