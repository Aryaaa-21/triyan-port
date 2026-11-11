import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  CATEGORY_KEYS,
  EMOTION_KEYS,
  LANGUAGE_KEYS,
  THEME_KEYS,
  type CategoryKey,
} from '@triyan/shared';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { InstagramMedia } from '../models/index.js';

/**
 * Imports the owner's screenshot archive of @triyanwrites:
 *
 *   npm run import:instagram-archive -w @triyan/server
 *
 * The posts are described in `server/data/instagram-archive.json`; their images are
 * static files under `client/public/archive/instagram`. Each post was sorted into its
 * category by reading the image itself, so it is stored as an already-reviewed
 * classification that neither a sync nor "reclassify" will overwrite.
 *
 * Safe to run again: posts are matched on their Instagram shortcode. Anything an
 * admin changed afterwards (featured, hidden, a corrected category) is left alone.
 */

const slideSchema = z.object({
  url: z.string().startsWith('/archive/instagram/'),
  thumbUrl: z.string().startsWith('/archive/instagram/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const postSchema = z.object({
  code: z.string().min(5).max(40),
  kind: z.enum(['post', 'reel']),
  timestamp: z.coerce.date(),
  caption: z.string().max(5_000),
  displayTitle: z.string().max(200).default(''),
  altText: z.string().max(400).default(''),
  slides: z.array(slideSchema).min(1),
  classification: z.object({
    primaryCategory: z.enum(CATEGORY_KEYS),
    secondaryCategories: z.array(z.enum(CATEGORY_KEYS)).max(2).default([]),
    themes: z.array(z.enum(THEME_KEYS)).max(8).default([]),
    emotions: z.array(z.enum(EMOTION_KEYS)).max(8).default([]),
    language: z.enum(LANGUAGE_KEYS).default('UNKNOWN'),
    confidence: z.number().min(0).max(1).default(0.8),
  }),
});

const archiveSchema = z.object({
  account: z.string(),
  capturedAt: z.string(),
  classifierVersion: z.string(),
  posts: z.array(postSchema),
});

const DATA_FILE = fileURLToPath(new URL('../../data/instagram-archive.json', import.meta.url));

const hashCaption = (caption: string) => createHash('sha256').update(caption).digest('hex');

const main = async () => {
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  const archive = archiveSchema.parse(JSON.parse(await readFile(DATA_FILE, 'utf8')));
  await connectDatabase();

  const now = new Date();
  const counts = { created: 0, updated: 0, keptCorrection: 0 };
  const perCategory = new Map<CategoryKey, number>();

  for (const post of archive.posts) {
    const [first, ...rest] = post.slides;
    if (!first) continue;
    const c = post.classification;
    perCategory.set(c.primaryCategory, (perCategory.get(c.primaryCategory) ?? 0) + 1);

    const media = {
      provider: 'archive' as const,
      permalink: `https://www.instagram.com/${post.kind === 'reel' ? 'reel' : 'p'}/${post.code}/`,
      // Only a still of each reel is archived, so it is stored as an image; REELS keeps the filter honest.
      mediaType: rest.length > 0 ? ('CAROUSEL_ALBUM' as const) : ('IMAGE' as const),
      productType: post.kind === 'reel' ? ('REELS' as const) : ('FEED' as const),
      caption: post.caption,
      captionHash: hashCaption(post.caption),
      timestamp: post.timestamp,
      mediaUrl: first.url,
      thumbnailUrl: first.thumbUrl,
      mediaWidth: first.width,
      mediaHeight: first.height,
      children:
        rest.length > 0
          ? post.slides.map((s) => ({
              mediaType: 'IMAGE' as const,
              mediaUrl: s.url,
              thumbnailUrl: s.thumbUrl,
              mediaWidth: s.width,
              mediaHeight: s.height,
            }))
          : [],
      available: true,
      unavailableSince: null,
      syncedAt: now,
    };
    const classification = {
      primaryCategory: c.primaryCategory,
      secondaryCategories: c.secondaryCategories.filter((k) => k !== c.primaryCategory),
      themes: c.themes,
      emotions: c.emotions,
      language: c.language,
      confidence: c.confidence,
      needsReview: false,
      method: 'LLM' as const,
      classifierVersion: archive.classifierVersion,
      classifiedAt: now,
    };

    const existing = await InstagramMedia.findOne({ sourceId: post.code });
    if (!existing) {
      await InstagramMedia.create({
        sourceId: post.code,
        ...media,
        classification,
        // Guards the image-based classification from the caption-only rules classifier.
        manualOverride: true,
        displayTitle: post.displayTitle,
        altText: post.altText,
      });
      counts.created += 1;
      continue;
    }

    Object.assign(existing, media);
    // A human correction in the admin always wins over a re-import.
    if (existing.classification?.method === 'MANUAL') {
      counts.keptCorrection += 1;
    } else {
      existing.classification = classification;
      existing.manualOverride = true;
    }
    if (!existing.displayTitle) existing.displayTitle = post.displayTitle;
    if (!existing.altText) existing.altText = post.altText;
    await existing.save();
    counts.updated += 1;
  }

  console.log(`Imported ${archive.posts.length} posts from @${archive.account}:`, counts);
  for (const key of CATEGORY_KEYS) console.log(`  ${key.padEnd(28)} ${perCategory.get(key) ?? 0}`);
  await disconnectDatabase();
};

main().catch(async (error: unknown) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
