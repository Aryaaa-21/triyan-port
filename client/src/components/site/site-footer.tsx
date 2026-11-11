import Link from 'next/link';
import { NAV_LINKS } from './nav-links';

interface FooterProps {
  literaryInstagram?: string;
  personalInstagram?: string;
  email?: string;
}

export function SiteFooter({ literaryInstagram, email }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="gutter mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 py-14 sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-2xl font-light tracking-tight">Triyan Writes</p>
          <p className="mt-2 max-w-xs font-reading text-sm text-fg-subtle">
            An archive of everything that words cannot contain.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {literaryInstagram && (
              <li>
                <a
                  href={literaryInstagram}
                  rel="me noopener noreferrer"
                  target="_blank"
                  className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
                >
                  @triyanwrites ↗
                </a>
              </li>
            )}
            {email && (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
                >
                  Email
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl border-t border-border/60 py-6">
        <p className="font-ui text-2xs text-fg-subtle">© {year} Triyan. All rights reserved.</p>
      </div>
    </footer>
  );
}
