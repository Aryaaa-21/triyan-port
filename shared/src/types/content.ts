import type {
  CategoryKey,
  ContentTypeKey,
  EmotionKey,
  LanguageKey,
  ThemeKey,
  WritingStatus,
} from '../taxonomy.js';

/** A writing as the API serialises it. Dates are ISO strings over the wire. */
export interface WritingDto {
  _id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  language: LanguageKey;
  contentType: ContentTypeKey;
  primaryCategory: CategoryKey | null;
  secondaryCategories: CategoryKey[];
  themes: ThemeKey[];
  emotions: EmotionKey[];
  tags: string[];
  status: WritingStatus;
  featured: boolean;
  publishedAt: string | null;
  bookExclusive: boolean;
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
    noindex: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SitemapEntry {
  slug: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: string;
}
