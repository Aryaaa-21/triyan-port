'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAV_LINKS } from './nav-links';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/cn';

/**
 * Global navigation.
 *
 * Desktop is a single quiet line of text — no bar, no shadow, no pill buttons. On
 * mobile it becomes a full-screen panel rather than a squeezed desktop navbar: the
 * links are set at reading size, which is the point of the site.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  /**
   * Close the panel when the route changes, or the reader lands on a page they
   * cannot see. Adjusted during render rather than in an effect — React's documented
   * pattern for resetting state when a prop changes, and it avoids the extra commit
   * an effect would cause.
   */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (pathname !== renderedPath) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="gutter sticky top-0 z-nav bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between py-5">
        <Link
          href="/"
          className="font-ui text-2xs tracking-widest text-fg uppercase no-underline"
          aria-label="Triyan — home"
        >
          Triyan
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'font-ui text-2xs tracking-widest uppercase no-underline transition-colors',
                isActive(link.href) ? 'text-fg' : 'text-fg-subtle hover:text-fg',
              )}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-6 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="font-ui text-2xs tracking-widest text-fg uppercase"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-overlay flex flex-col bg-bg"
        >
          <div className="gutter flex items-center justify-between py-5">
            <span className="font-ui text-2xs tracking-widest text-fg uppercase">Triyan</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="font-ui text-2xs tracking-widest text-fg uppercase"
            >
              Close
            </button>
          </div>

          <nav aria-label="Primary" className="gutter flex flex-1 flex-col justify-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'font-display text-4xl font-light no-underline',
                  isActive(link.href) ? 'text-fg' : 'text-fg-muted',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
