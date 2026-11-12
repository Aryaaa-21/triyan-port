import { fetchAboutSafely, fetchSettings } from '@/features/content/api';
import { Label } from '@/components/editorial';
import { ContactForm } from '@/features/contact/contact-form';
import { Reveal } from '@/components/ui/reveal';
import { useLoaderData } from 'react-router';
import { Meta } from '@/lib/meta';

/**
 * The final door. Quiet: a sentence, the ways to reach Triyan, and a form that is
 * honest about whether a message can actually arrive.
 */
export async function loader() {
  const [about, settings] = await Promise.all([
    fetchAboutSafely(),
    fetchSettings()
      .then((r) => r.data)
      .catch(() => null),
  ]);
  return { about, settings };
}

export default function ContactPage() {
  const { about, settings } = useLoaderData<typeof loader>();
  // Open only when messages have somewhere real to go (the inbox, or email).
  const deliverable = Boolean(
    settings?.contactFormEnabled &&
    (settings.contactDelivery === 'INBOX' || settings.contactDelivery === 'EMAIL'),
  );

  const channels: { label: string; value: string; href?: string; external?: boolean }[] = [
    // An address that has not been supplied is left out, not shown as a blank.
    ...(about?.links.email
      ? [{ label: 'Email', value: about.links.email, href: `mailto:${about.links.email}` }]
      : []),
    ...(about?.links.literaryInstagram
      ? [
          {
            label: 'Instagram',
            value: '@triyanwrites',
            href: about.links.literaryInstagram,
            external: true,
          },
        ]
      : []),
  ];

  return (
    <main id="main" className="gutter">
      <Meta
        title="Contact"
        description="Write to Triyan — about the poetry, the book Leaving and Living, or the work to come. A message form and the Instagram account are here."
        canonical="/contact"
      />
      <div className="mx-auto max-w-[90rem] pt-16 pb-32 sm:pt-24">
        <header className="max-w-5xl">
          <Label as="p">Contact</Label>
          <h1 className="mt-8 font-display text-[clamp(3.5rem,11vw,9.5rem)] leading-[0.88] font-light tracking-[-0.03em]">
            Write<span className="text-fg-subtle">.</span>
          </h1>
          <Reveal stagger={1}>
            <p className="mt-10 max-w-xl font-display text-[clamp(1.5rem,2.5vw,2.25rem)] leading-snug font-light text-fg-muted italic">
              For readings, publication, collaboration — or simply because something here stayed
              with you.
            </p>
          </Reveal>
        </header>

        <div className="mt-28 grid gap-20 lg:grid-cols-12 lg:gap-8">
          <section aria-labelledby="channels-heading" className="lg:col-span-4">
            <h2 id="channels-heading" className="sr-only">
              Ways to reach Triyan
            </h2>
            <dl className="divide-y divide-border border-y border-border">
              {channels.map((c) => (
                <div key={c.label} className="py-6">
                  <Label as="dt">{c.label}</Label>
                  <dd className="mt-2">
                    {c.href ? (
                      <a
                        href={c.href}
                        {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group inline-flex items-baseline gap-3 font-display text-2xl font-light text-fg no-underline hover:text-accent"
                      >
                        {c.value}
                        <span
                          aria-hidden="true"
                          className="font-mono text-xs text-fg-subtle transition-transform group-hover:translate-x-1"
                        >
                          {c.external ? '↗' : '→'}
                        </span>
                        {c.external && <span className="sr-only"> (opens in a new tab)</span>}
                      </a>
                    ) : (
                      <span className="font-display text-2xl font-light text-fg-subtle italic">
                        {c.value}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="form-heading" className="lg:col-span-6 lg:col-start-7">
            <h2
              id="form-heading"
              className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
            >
              A message
            </h2>
            <div className="mt-8">
              <ContactForm deliverable={deliverable} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
