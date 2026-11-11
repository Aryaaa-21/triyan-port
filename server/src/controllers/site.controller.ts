import type { Request, RequestHandler } from 'express';
import { Writing } from '../models/index.js';
import { publicFilter } from '../services/writing.service.js';

/** The site's own origin, as the visitor reached it (the site and API share one). */
const origin = (req: Request) => `${req.protocol}://${req.get('host') ?? 'localhost'}`;

const STATIC_ROUTES: [path: string, changefreq: string, priority: string][] = [
  ['/', 'weekly', '1.0'],
  ['/writings', 'daily', '0.9'],
  ['/book', 'monthly', '0.8'],
  ['/about', 'monthly', '0.7'],
  ['/instagram', 'daily', '0.6'],
  ['/abyss', 'monthly', '0.6'],
  ['/contact', 'yearly', '0.4'],
];

const escapeXml = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (c) => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[c]};`,
  );

/** robots.txt: everything but the admin and the API is open to crawlers. */
export const robotsTxt: RequestHandler = (req, res) => {
  const site = origin(req);
  res
    .type('text/plain')
    .set('cache-control', 'public, max-age=3600')
    .send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/',
        '',
        `Sitemap: ${site}/sitemap.xml`,
        `Host: ${site}`,
        '',
      ].join('\n'),
    );
};

/**
 * sitemap.xml: the site's pages and every published, indexable writing. A sitemap
 * missing its writings (database unreachable) is better than an error.
 */
export const sitemapXml: RequestHandler = async (req, res) => {
  const site = origin(req);
  const writings: { slug: string; updatedAt?: Date }[] = await Writing.find({
    ...publicFilter(),
    'seo.noindex': { $ne: true },
  })
    .select('slug updatedAt')
    .sort({ publishedAt: -1 })
    .lean()
    .catch(() => []);
  const urls = [
    ...STATIC_ROUTES.map(
      ([path, changefreq, priority]) =>
        `<url><loc>${escapeXml(site + path)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
    ),
    ...writings.map(
      (w) =>
        `<url><loc>${escapeXml(`${site}/writings/${w.slug}`)}</loc>${
          w.updatedAt ? `<lastmod>${new Date(w.updatedAt).toISOString()}</lastmod>` : ''
        }<changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    ),
  ];
  res
    .type('application/xml')
    .set('cache-control', 'public, max-age=600')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    );
};
