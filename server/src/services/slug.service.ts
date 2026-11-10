import { Writing } from '../models/index.js';

/**
 * Turns a title into a URL slug.
 *
 * Slugs are ASCII by deliberate choice: a public URL should survive being copied into
 * a message, a search box or an address bar without percent-encoding. That has a
 * consequence worth stating plainly — **a Devanagari title cannot become a slug by
 * lowercasing it.** Rather than silently producing an empty slug, a title with no
 * ASCII content falls back to a readable placeholder that the admin is expected to
 * replace with a transliteration.
 */
export const slugify = (title: string): string => {
  const ascii = title
    .normalize('NFKD')
    // Strip combining marks left by the decomposition.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
    .replace(/-+$/g, '');

  return ascii;
};

export const SLUG_FALLBACK_PREFIX = 'writing';

/**
 * Produces a slug that is guaranteed to be unique and schema-valid.
 * `excludeId` lets an existing writing keep its own slug while being edited.
 */
export const uniqueSlug = async (desired: string, excludeId?: string): Promise<string> => {
  const base = slugify(desired) || `${SLUG_FALLBACK_PREFIX}-${Date.now().toString(36)}`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await Writing.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select('_id')
      .lean();
    if (!clash) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
};

/** True when a title yields no usable ASCII slug, so the admin must supply one. */
export const needsManualSlug = (title: string): boolean => slugify(title).length === 0;
