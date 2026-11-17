import { Reveal } from '@/components/ui/reveal';
import { Meta } from '@/lib/meta';
import { MAKER } from '@/components/site/credit';

const mono = 'font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase';

const ROWS: { label: string; value: string; href?: string }[] = [
  { label: 'Words, poetry and artwork', value: 'Triyan' },
  { label: 'Instagram', value: '@triyanwrites', href: 'https://www.instagram.com/triyanwrites/' },
  { label: 'Book', value: 'Leaving and Living — Triyan' },
  {
    label: 'Typefaces',
    value:
      'Aquiline Two · Cormorant Garamond · Spectral · Geist · Geist Mono · Archivo · Tiro Devanagari Hindi',
  },
  {
    label: 'Built with',
    value: 'React · React Router · Vite · Tailwind CSS · Express · MongoDB · WebGL',
  },
  { label: 'Hosted on', value: 'Vercel' },
];

/** Who made the site, and what it is made of. */
export default function CreditsPage() {
  return (
    <main id="main" className="gutter">
      <Meta
        title="Credits"
        description={`Credits for Triyan Writes. Website designed and built by ${MAKER.name} (${MAKER.handle}).`}
        canonical="/credits"
      />
      <div className="mx-auto max-w-[90rem] py-24 lg:py-36">
        <p className={mono}>Credits</p>
        <h1 className="mt-6 font-display text-[clamp(3rem,10vw,7.5rem)] leading-[0.95] font-light tracking-tight">
          Made by
          <br />
          <a
            href={MAKER.url}
            target="_blank"
            rel="noopener"
            className="italic no-underline transition-colors hover:text-fg-muted"
          >
            {MAKER.handle}
          </a>
        </h1>

        <Reveal variant="blur">
          <div className="mt-16 grid gap-10 border-t border-border pt-10 lg:grid-cols-12 lg:gap-8">
            <p className={`${mono} lg:col-span-3`}>Design and development</p>
            <div className="lg:col-span-8">
              <p className="font-display text-[clamp(1.75rem,4vw,3rem)] leading-tight font-light">
                {MAKER.name}
              </p>
              <p className="mt-4 max-w-2xl font-reading text-xl leading-prose text-fg-muted">
                Designed and built this website, from the black hole on the first screen to the
                archive of every writing.
              </p>
              <a
                href={MAKER.url}
                target="_blank"
                rel="noopener"
                className="mt-8 inline-block border-b border-border-strong pb-1 font-mono text-xs tracking-[0.18em] text-fg uppercase no-underline transition-colors hover:border-fg"
              >
                {MAKER.display} ↗
              </a>
            </div>
          </div>
        </Reveal>

        <dl className="mt-20 border-t border-border">
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="grid gap-3 border-b border-border py-7 lg:grid-cols-12 lg:gap-8"
            >
              <dt className={`${mono} lg:col-span-3`}>{row.label}</dt>
              <dd className="font-reading text-lg leading-prose text-fg-muted lg:col-span-8">
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-fg">
                    {row.value} ↗
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
