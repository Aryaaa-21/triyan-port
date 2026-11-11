import Link from '@/lib/link';
import { NAV_LINKS } from './nav-links';

interface FooterProps {
  literaryInstagram?: string;
  personalInstagram?: string;
  email?: string;
}

/**
 * The end of the journey, not a sitemap: one closing line, the destinations in a
 * single row, and the mark. External links appear only once they have been supplied.
 */
export function SiteFooter({ literaryInstagram, email }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="gutter mt-auto border-t border-border">
      <div className="mx-auto max-w-[90rem] pt-20 pb-10">
        <p
          aria-hidden="true"
          className="font-display text-[clamp(3rem,11vw,10rem)] leading-[0.85] font-light tracking-[-0.03em] text-fg-subtle/35 uppercase select-none"
        >
          Triyan Writes
        </p>

        <div className="mt-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase no-underline transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {(literaryInstagram || email) && (
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {literaryInstagram && (
                <li>
                  <a
                    href={literaryInstagram}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="font-mono text-2xs tracking-[0.18em] text-fg uppercase no-underline transition-colors hover:text-accent"
                  >
                    @triyanwrites ↗
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="font-mono text-2xs tracking-[0.18em] text-fg uppercase no-underline transition-colors hover:text-accent"
                  >
                    Email
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
            © {year} Triyan Writes
          </p>
          <p className="font-display text-base font-light text-fg-subtle italic">
            soul is deeper than the abyss
          </p>
        </div>
      </div>
    </footer>
  );
}
