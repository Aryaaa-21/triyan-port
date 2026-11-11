import { siteName, siteUrl } from './env';

export interface MetaProps {
  /** The page's own title; the site name is appended. */
  title?: string;
  /** A complete title, used as is (the homepage). */
  absoluteTitle?: string;
  /** Overrides for social cards, when they should differ from the page's own. */
  ogTitle?: string;
  ogDescription?: string;
  description?: string;
  /** Path ("/writings/x") or absolute URL. */
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  type?: 'website' | 'article' | 'book' | 'profile';
  image?: string;
  locale?: string;
  publishedTime?: string;
}

const absolute = (url: string) => (/^https?:/i.test(url) ? url : `${siteUrl}${url}`);

/**
 * A page's head: title, description, canonical, robots, Open Graph and Twitter cards.
 * React 19 places these in <head> wherever they are rendered, so each page renders
 * exactly one <Meta>.
 */
export function Meta({
  title,
  absoluteTitle,
  ogTitle,
  ogDescription,
  description,
  canonical,
  noindex = false,
  nofollow = false,
  type = 'website',
  image,
  locale,
  publishedTime,
}: MetaProps) {
  const fullTitle = absoluteTitle ?? (title ? `${title} — ${siteName}` : siteName);
  const cardTitle = ogTitle ?? title ?? fullTitle;
  const cardDescription = ogDescription ?? description;
  const url = canonical ? absolute(canonical) : undefined;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      <meta
        name="robots"
        content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`}
      />
      <meta property="og:title" content={cardTitle} />
      {cardDescription && <meta property="og:description" content={cardDescription} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      {locale && <meta property="og:locale" content={locale} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {image && <meta property="og:image" content={absolute(image)} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={cardTitle} />
      {cardDescription && <meta name="twitter:description" content={cardDescription} />}
      {image && <meta name="twitter:image" content={absolute(image)} />}
    </>
  );
}
