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
  /** When it was emailed to subscribers, if it has been. */
  notifiedAt?: string | null;
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
  /** Every shop that sells the book, in the order they are offered. */
  purchaseLinks: { label: string; url: string }[];
  /** The shop's own standing for the book, e.g. Amazon's star average. */
  rating: { value: string; count: number; source: string; url: string } | null;
  reviews: {
    quote: string;
    title?: string;
    attribution?: string;
    source?: string;
    publishedAt?: string | null;
    /** A screenshot of the review as the reader posted it. */
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
  }[];
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
  /** Whether readers can sign up for emails about new writings (needs the database). */
  newsletterEnabled?: boolean;
}

export interface ContactMessageDto {
  _id: string;
  name: string;
  email: string;
  message: string;
  source?: string;
  read: boolean;
  createdAt: string;
}

export type SubscriberStatus = 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';

/** Someone who asked to be emailed about new writings. */
export interface SubscriberDto {
  _id: string;
  email: string;
  status: SubscriberStatus;
  /** Shelves they asked about; empty means every new writing. */
  interests: string[];
  consentAt: string;
  confirmedAt: string | null;
  createdAt: string;
}

/** What the admin sees above the list. */
export interface SubscriberSummary {
  active: number;
  pending: number;
  unsubscribed: number;
  /** False until an email provider is configured on the server. */
  mailEnabled: boolean;
}

/** The outcome of emailing one writing to the list. */
export interface AnnouncementResult {
  total: number;
  sent: number;
  failed: number;
}

export interface WaitlistSubscriberDto {
  _id: string;
  email: string;
  name: string;
  consentAt: string;
  createdAt: string;
}
