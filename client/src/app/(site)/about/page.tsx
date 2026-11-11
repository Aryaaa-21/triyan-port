import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchAboutSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';
import { Rule } from '@/components/ui/rule';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Triyan has been writing since 2016 — poetry in English and Hindi on love, grief, absence, mortality and existence.',
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: { type: 'profile', url: `${siteUrl}/about`, title: 'About Triyan' },
};

export default async function AboutPage() {
  const about = await fetchAboutSafely();

  /**
   * Person structured data, built only from what the owner supplied. No birth date,
   * no awards, no affiliation — those were never given and are not inferred.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: about?.displayName || 'Triyan',
    alternateName: about?.literaryIdentity || 'Triyan Writes',
    url: `${siteUrl}/about`,
    jobTitle: 'Poet',
    ...(about?.links.literaryInstagram ? { sameAs: [about.links.literaryInstagram] } : {}),
  };

  const paragraphs = (about?.body ?? '').split('\n').filter((line) => line.trim().length > 0);

  return (
    <main id="main" className="gutter mx-auto measure-prose pt-20 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
        {about?.literaryIdentity || 'Triyan Writes'}
      </p>
      <h1 className="mt-6 font-display text-display leading-tight font-light tracking-tighter">
        {about?.displayName || 'Triyan'}
      </h1>

      <Rule className="my-12" />

      {paragraphs.length > 0 ? (
        <div className="font-reading text-lg leading-prose text-fg-muted">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className={index === 0 ? '' : 'mt-6'}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <p className="font-reading text-lg text-fg-subtle">This page is waiting for its words.</p>
      )}

      <Rule className="my-14" />

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <Link
          href="/writings"
          className="font-ui text-2xs tracking-widest text-fg uppercase no-underline hover:text-accent"
        >
          Read the archive →
        </Link>
        {about?.links.literaryInstagram && (
          <a
            href={about.links.literaryInstagram}
            target="_blank"
            rel="noopener noreferrer"
            className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
          >
            @triyanwrites ↗
          </a>
        )}
      </div>
    </main>
  );
}
