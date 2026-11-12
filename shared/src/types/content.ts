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
  /** The piece in the simplest words: the archive's reading, not the author's. */
  explanation: string;
  /** The Instagram post it was first published as; '' when there is none. */
  instagramUrl: string;
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

export interface BookDto {
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  salesLine: string;
  coverImageUrl: string;
  purchaseUrl: string;
  publisher: string;
  isbn: string;
  price: string;
  publicationDate: string | null;
  formats: string[];
  reviews: { quote: string; attribution?: string; source?: string }[];
  excerptSlugs: string[];
  published: boolean;
}

export interface AboutDto {
  displayName: string;
  literaryIdentity: string;
  writingSince: string;
  body: string;
  statement: string;
  portraitUrl: string;
  links: { literaryInstagram: string; personalInstagram: string; email: string };
}

export interface AbyssDto {
  name: string;
  tagline: string;
  philosophy: string;
  direction: string;
  comingSoonNote: string;
  published: boolean;
}

export interface SiteSettingsDto {
  siteTitle: string;
  tagline: string;
  defaultSeoDescription: string;
  defaultOgImageUrl: string;
  contactFormEnabled: boolean;
  introEnabled: boolean;
  /**
   * Where contact messages go. INBOX: stored for the owner in the admin (no email
   * transport yet). EMAIL: sent on. NONE: nowhere — the form must stay closed.
   */
  contactDelivery: 'NONE' | 'EMAIL' | 'INBOX';
}

export interface ContactMessageDto {
  _id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface WaitlistSubscriberDto {
  _id: string;
  email: string;
  name: string;
  consentAt: string;
  createdAt: string;
}
