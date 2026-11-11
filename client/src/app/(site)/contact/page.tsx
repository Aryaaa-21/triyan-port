import type { Metadata } from 'next';
import { fetchAboutSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';
import { Rule } from '@/components/ui/rule';
import { ContactForm } from '@/features/contact/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Write to Triyan.',
  alternates: { canonical: `${siteUrl}/contact` },
};

export default async function ContactPage() {
  const about = await fetchAboutSafely();

  return (
    <main id="main" className="gutter mx-auto measure-prose pt-20 pb-32">
      <h1 className="font-display text-display leading-tight font-light tracking-tighter">
        Contact
      </h1>
      <p className="mt-8 font-reading text-lg leading-prose text-fg-muted">
        For readings, publication, collaboration — or simply because something here landed.
      </p>

      <Rule className="my-12" />

      <ContactForm />

      <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3">
        {/* Only shown once an address has actually been supplied. */}
        {about?.links.email && (
          <a
            href={`mailto:${about.links.email}`}
            className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
          >
            {about.links.email}
          </a>
        )}
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
