import type { MetadataRoute } from 'next';
import { fetchSitemapEntries } from '@/features/writings/api';
import { siteUrl } from '@/lib/env';

/**
 * Only published, indexable writings appear here. The API applies that filter, so a
 * draft cannot reach the sitemap even if this file forgets to ask.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/writings`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const { data } = await fetchSitemapEntries();
    return [
      ...staticRoutes,
      ...data.map((entry) => ({
        url: `${siteUrl}/writings/${entry.slug}`,
        lastModified: new Date(entry.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A sitemap missing its writings is better than a 500 at /sitemap.xml.
    return staticRoutes;
  }
}
