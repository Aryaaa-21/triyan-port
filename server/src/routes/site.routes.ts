import { Router } from 'express';
import { robotsTxt, sitemapXml } from '../controllers/site.controller.js';

/** The files crawlers look for at the site's root. */
export const siteRouter = Router();
siteRouter.get('/robots.txt', robotsTxt);
siteRouter.get('/sitemap.xml', sitemapXml);
