import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAboutSafely } from '@/features/content/api';
import { siteUrl } from '@/lib/env';
import { ArrowLink, ContentPending, Label, SectionIntro } from '@/components/editorial';
import { SplitText } from '@/components/motion/split-text';
import { Reveal } from '@/components/ui/reveal';
import {
  FOR_THE_READER,
  JOURNEY,
  PORTRAIT_BIO,
  PORTRAIT_BIO_CLOSE,
  REMEMBER,
  THEMES,
} from '@/content/triyan';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Triyan — writer, poet and author of Leaving and Living. Writing since 2016, in English and Hindi, on love, grief, absence, mortality and existence.',
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: { type: 'profile', url: `${siteUrl}/about`, title: 'About Triyan' },
};

export default async function AboutPage() {
  const about = await fetchAboutSafely();
  const name = about?.displayName || 'Triyan';
  const since = about?.writingSince || '2016';

  /** Person structured data, built only from what the owner supplied. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    alternateName: about?.literaryIdentity || 'Triyan Writes',
    url: `${siteUrl}/about`,
    jobTitle: ['Poet', 'Writer', 'Author'],
    ...(about?.links.literaryInstagram ? { sameAs: [about.links.literaryInstagram] } : {}),
  };

  const paragraphs = (about?.body ?? '').split('\n').filter((line) => line.trim().length > 0);

  return (
    <main id="main" className="gutter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
        {/* ---------------------------------------------------------- name */}
        <header className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Label as="p">{about?.literaryIdentity || 'Triyan Writes'}</Label>
            <h1 className="mt-8 font-display text-[clamp(4rem,11.5vw,11rem)] leading-[0.82] font-light tracking-[-0.04em] whitespace-nowrap uppercase">
              <SplitText text={name} step={70} />
            </h1>
            <Reveal stagger={2}>
              <ul className="mt-12 space-y-1 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight font-light text-fg-muted italic">
                <li>writer</li>
                <li className="pl-[1.2em]">poet</li>
                <li className="pl-[2.4em]">author</li>
              </ul>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            {about?.portraitUrl ? (
              <Reveal variant="clip">
                <div className="relative aspect-[3/4] w-full bg-surface">
                  <Image
                    src={about.portraitUrl}
                    alt={`Portrait of ${name}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 30vw, 90vw"
                    className="object-cover grayscale"
                  />
                </div>
              </Reveal>
            ) : (
              <div className="portrait-void relative flex aspect-[3/4] w-full items-end bg-surface p-6">
                <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
                  Portrait to be added
                </p>
              </div>
            )}
            <Reveal stagger={2}>
              <div className="mt-10 max-w-md">
                <p className="font-reading text-lg leading-prose text-fg-muted">{PORTRAIT_BIO}</p>
                <p className="mt-6 font-display text-2xl leading-snug font-light text-fg italic">
                  {PORTRAIT_BIO_CLOSE}
                </p>
              </div>
            </Reveal>
          </div>
        </header>

        {/* ------------------------------------------------------ the writer */}
        <section
          aria-labelledby="writer-heading"
          className="mt-32 grid gap-12 lg:mt-48 lg:grid-cols-12 lg:gap-8"
        >
          <div className="lg:col-span-4">
            <SectionIntro label="In Triyan's words" className="mb-8" />
            <h2 id="writer-heading" className="font-display text-4xl font-light tracking-tight">
              The writer
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-6">
            {paragraphs.length > 0 ? (
              <div className="space-y-7 font-reading text-xl leading-prose text-fg-muted [&>p:first-child]:font-display [&>p:first-child]:text-3xl [&>p:first-child]:leading-snug [&>p:first-child]:font-light [&>p:first-child]:text-fg">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <ContentPending>The biography will be added here.</ContentPending>
            )}
          </div>
        </section>

        {/* --------------------------------------------------------- journey */}
        <section aria-labelledby="journey-heading" className="mt-32 lg:mt-48">
          <SectionIntro label="Writing journey" className="mb-16" />
          <h2 id="journey-heading" className="sr-only">
            Writing journey
          </h2>
          <ol className="journey relative lg:ml-[33%]">
            {JOURNEY.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                stagger={i}
                className="relative grid grid-cols-[5.5rem_1fr] gap-6 pb-16 last:pb-0 sm:grid-cols-[8rem_1fr]"
              >
                <span className="font-display text-3xl font-light text-fg-subtle tabular-nums">
                  {i === 0 ? since : '—'}
                </span>
                <div>
                  <p
                    className={
                      step.title === 'ABYSS'
                        ? 'font-abyss text-4xl text-fg'
                        : 'font-display text-4xl leading-tight font-light text-fg'
                    }
                  >
                    {step.title === 'ABYSS' ? 'abyss' : step.title}
                  </p>
                  <p className="mt-3 max-w-lg font-reading text-lg leading-prose text-fg-muted">
                    {step.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------------- themes */}
        <section aria-labelledby="themes-heading" className="mt-32 lg:mt-48">
          <SectionIntro label="What it returns to" className="mb-16" />
          <h2 id="themes-heading" className="sr-only">
            Themes
          </h2>
          <Reveal variant="blur">
            <ul className="flex flex-wrap items-baseline gap-x-[0.5em] gap-y-2 font-display text-[clamp(2rem,5vw,4.5rem)] leading-[1.1] font-light tracking-tight">
              {THEMES.map((theme, i) => (
                <li
                  key={theme}
                  className={
                    i % 3 === 1
                      ? 'text-fg-subtle italic'
                      : i % 3 === 2
                        ? 'text-fg-muted'
                        : 'text-fg'
                  }
                >
                  {theme}
                  {i < THEMES.length - 1 && (
                    <span aria-hidden="true" className="text-fg-subtle">
                      ,
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* ---------------------------------------------------- for the reader */}
        <section
          aria-labelledby="reader-heading"
          className="mt-32 grid gap-12 border-t border-border pt-20 lg:mt-48 lg:grid-cols-12 lg:gap-8"
        >
          <h2
            id="reader-heading"
            className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase lg:col-span-3"
          >
            For the reader
          </h2>
          <Reveal className="lg:col-span-8">
            <blockquote className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-snug font-light text-fg">
              {FOR_THE_READER}
            </blockquote>
          </Reveal>
        </section>

        {/* -------------------------------------------------------- remember */}
        <section aria-labelledby="remember-heading" className="mt-32 lg:mt-48">
          <h2 id="remember-heading" className="sr-only">
            What to remember
          </h2>
          <Reveal variant="blur">
            <p className="max-w-5xl font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] font-light tracking-tight italic">
              {REMEMBER.charAt(0).toUpperCase() + REMEMBER.slice(1)}
            </p>
          </Reveal>
        </section>

        {/* ------------------------------------------------------ philosophy */}
        {about?.statement && (
          <section
            aria-labelledby="philosophy-heading"
            className="mt-32 border-t border-border pt-20 lg:mt-48"
          >
            <h2
              id="philosophy-heading"
              className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
            >
              Philosophy
            </h2>
            <Reveal variant="blur">
              <blockquote className="mt-12 max-w-5xl font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.05] font-light tracking-tight">
                {about.statement}
              </blockquote>
            </Reveal>
          </section>
        )}

        {/* ---------------------------------------------------- current work */}
        <section
          aria-labelledby="now-heading"
          className="mt-32 border-t border-border pt-20 lg:mt-48"
        >
          <h2
            id="now-heading"
            className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
          >
            Current work
          </h2>
          <div className="mt-12 grid gap-px bg-border sm:grid-cols-3">
            {[
              { href: '/writings', title: 'The archive', note: 'Every published writing.' },
              { href: '/book', title: 'Leaving and Living', note: 'The book.' },
              { href: '/abyss', title: 'ABYSS', note: 'The world beyond the words.' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block bg-bg p-8 no-underline sm:p-10"
              >
                <span
                  className={
                    item.title === 'ABYSS'
                      ? 'font-abyss text-3xl text-fg'
                      : 'font-display text-3xl font-light text-fg'
                  }
                >
                  {item.title === 'ABYSS' ? 'abyss' : item.title}
                </span>
                <span className="mt-3 block font-reading text-base text-fg-muted">{item.note}</span>
                <span
                  aria-hidden="true"
                  className="mt-8 block font-mono text-xs text-fg-subtle transition-transform duration-500 group-hover:translate-x-1.5"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
          {about?.links.literaryInstagram && (
            <div className="mt-12">
              <ArrowLink href={about.links.literaryInstagram} external tone="quiet">
                @triyanwrites
              </ArrowLink>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
