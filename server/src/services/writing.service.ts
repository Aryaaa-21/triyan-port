import type { QueryFilter, SortOrder } from 'mongoose';

// Mongoose 9 renamed FilterQuery to QueryFilter. Aliased so the call sites read the
// way the rest of the codebase talks about them.
type FilterQuery<T> = QueryFilter<T>;
import type { WritingInput, WritingQuery, WritingUpdate } from '@triyan/shared';
import { Writing, type WritingAttrs } from '../models/index.js';
import { uniqueSlug } from './slug.service.js';

/**
 * The one place that decides what the public may see.
 *
 * Every public read goes through `publicFilter()`. Drafts and book-exclusive writings
 * are excluded here rather than in each controller, because an invariant enforced in
 * five places is an invariant that will eventually be forgotten in a sixth.
 */
export const publicFilter = (): FilterQuery<WritingAttrs> => ({
  status: 'PUBLISHED',
  bookExclusive: { $ne: true },
});

const SORTS: Record<string, Record<string, SortOrder>> = {
  newest: { publishedAt: -1, createdAt: -1 },
  oldest: { publishedAt: 1, createdAt: 1 },
  title: { title: 1 },
};

export interface PagedWritings {
  items: WritingAttrs[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const buildFilter = (query: WritingQuery, base: FilterQuery<WritingAttrs>) => {
  const filter: FilterQuery<WritingAttrs> = { ...base };

  const categories = query.categories ?? (query.category ? [query.category] : undefined);
  if (categories?.length) {
    filter.$or = [
      { primaryCategory: { $in: categories } },
      { secondaryCategories: { $in: categories } },
    ];
  }

  if (query.themes?.length) filter.themes = { $all: query.themes };
  if (query.emotions?.length) filter.emotions = { $all: query.emotions };
  if (query.tags?.length) filter.tags = { $all: query.tags };
  if (query.language) filter.language = query.language;
  if (query.featured !== undefined) filter.featured = query.featured;

  if (query.from || query.to) {
    filter.publishedAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }

  if (query.q) filter.$text = { $search: query.q };

  return filter;
};

export const listWritings = async (
  query: WritingQuery,
  base: FilterQuery<WritingAttrs> = publicFilter(),
): Promise<PagedWritings> => {
  const filter = buildFilter(query, base);
  const skip = (query.page - 1) * query.limit;

  // Text search ranks by relevance unless an explicit order was requested.
  const useRelevance = Boolean(query.q) && (query.sort === 'relevance' || query.sort === 'newest');
  const sort = useRelevance
    ? { score: { $meta: 'textScore' as const }, publishedAt: -1 as SortOrder }
    : (SORTS[query.sort] ?? SORTS.newest);

  const projection = query.q ? { score: { $meta: 'textScore' as const } } : {};

  const [items, total] = await Promise.all([
    Writing.find(filter, projection).sort(sort).skip(skip).limit(query.limit).lean(),
    Writing.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
};

export const findPublishedBySlug = async (slug: string): Promise<WritingAttrs | null> =>
  Writing.findOne({ ...publicFilter(), slug }).lean();

/**
 * Related writings, scored deterministically and explainably.
 *
 * No embeddings, no model, no API call: shared category, themes, tags and language,
 * weighted. The same input always produces the same output, and the reason a writing
 * appears can be stated in one sentence.
 */
export const RELATED_WEIGHTS = {
  primaryCategory: 5,
  secondaryCategory: 2,
  theme: 2,
  tag: 1,
  language: 1,
} as const;

export const findRelated = async (
  writing: Pick<
    WritingAttrs,
    'primaryCategory' | 'secondaryCategories' | 'themes' | 'tags' | 'language' | 'slug'
  >,
  limit = 3,
): Promise<WritingAttrs[]> => {
  type Category = NonNullable<WritingAttrs['primaryCategory']>;
  const categories = [writing.primaryCategory, ...(writing.secondaryCategories ?? [])].filter(
    (c): c is Category => Boolean(c),
  );

  const candidates = await Writing.find({
    ...publicFilter(),
    slug: { $ne: writing.slug },
    $or: [
      ...(categories.length
        ? [{ primaryCategory: { $in: categories } }, { secondaryCategories: { $in: categories } }]
        : []),
      ...(writing.themes?.length ? [{ themes: { $in: writing.themes } }] : []),
      ...(writing.tags?.length ? [{ tags: { $in: writing.tags } }] : []),
      ...(writing.language && writing.language !== 'UNKNOWN'
        ? [{ language: writing.language }]
        : []),
    ],
  })
    .limit(60)
    .lean();

  const scored = candidates.map((candidate) => {
    let score = 0;
    if (candidate.primaryCategory && candidate.primaryCategory === writing.primaryCategory) {
      score += RELATED_WEIGHTS.primaryCategory;
    }
    for (const category of candidate.secondaryCategories ?? []) {
      if (categories.includes(category)) score += RELATED_WEIGHTS.secondaryCategory;
    }
    for (const theme of candidate.themes ?? []) {
      if (writing.themes?.includes(theme)) score += RELATED_WEIGHTS.theme;
    }
    for (const tag of candidate.tags ?? []) {
      if (writing.tags?.includes(tag)) score += RELATED_WEIGHTS.tag;
    }
    if (candidate.language === writing.language && candidate.language !== 'UNKNOWN') {
      score += RELATED_WEIGHTS.language;
    }
    return { candidate, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.publishedAt?.getTime() ?? 0) - (a.candidate.publishedAt?.getTime() ?? 0),
    )
    .slice(0, limit)
    .map((entry) => entry.candidate as WritingAttrs);
};

/** Derives an excerpt at a line boundary so a stanza is never cut mid-line. */
export const deriveExcerpt = (content: string, max = 180): string => {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  let out = '';
  for (const line of lines) {
    if (out && (out + ' ' + line).length > max) break;
    out = out ? `${out} ${line}` : line;
    if (out.length >= max) break;
  }
  return out.length > max ? `${out.slice(0, max - 1).trimEnd()}…` : out;
};

export const createWriting = async (input: WritingInput) => {
  const slug = await uniqueSlug(input.slug ?? input.title);
  return Writing.create({
    ...input,
    slug,
    excerpt: input.excerpt?.trim() || deriveExcerpt(input.content),
  });
};

export const updateWriting = async (id: string, patch: WritingUpdate) => {
  const writing = await Writing.findById(id);
  if (!writing) return null;

  if (patch.slug && patch.slug !== writing.slug) {
    writing.slug = await uniqueSlug(patch.slug, id);
  }

  const assignable = { ...patch };
  delete assignable.slug;

  Object.assign(writing, assignable);

  if (patch.content && !patch.excerpt && !writing.excerpt) {
    writing.excerpt = deriveExcerpt(patch.content);
  }

  await writing.save();
  return writing;
};

export const setStatus = async (id: string, status: 'DRAFT' | 'PUBLISHED') => {
  const writing = await Writing.findById(id);
  if (!writing) return null;
  writing.status = status;
  await writing.save();
  return writing;
};

export const deleteWriting = async (id: string): Promise<boolean> => {
  const result = await Writing.deleteOne({ _id: id });
  return result.deletedCount === 1;
};
