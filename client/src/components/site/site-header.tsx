import Link from '@/lib/link';
import { usePathname } from '@/lib/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NAV_LINKS } from './nav-links';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/cn';

/**
 * Global navigation.
 *
 * Desktop: the wordmark and one quiet line of mono labels. Transparent over the top
 * of a page, it gains a dark layer once the reader scrolls. Mobile: a full-screen
 * chapter list, not a squeezed navbar.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Close the panel on navigation — adjusted during render, React's documented
  // pattern for resetting state when a value changes.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (pathname !== renderedPath) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  // The scrolled state lives on a data attribute, not in React state: it changes on
  // every scroll and nothing else needs to re-render for it.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => {
      header.dataset.scrolled = window.scrollY > 24 ? 'true' : 'false';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

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
    <header
      ref={headerRef}
      data-scrolled="false"
      className="site-header gutter sticky top-0 z-(--z-nav) border-b border-transparent transition-[background-color,border-color] duration-700"
    >
      <div className="mx-auto flex max-w-[90rem] items-center justify-between py-5">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.3em] text-fg uppercase no-underline"
          aria-label="Triyan Writes — home"
        >
          Triyan Writes
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'nav-link relative font-mono text-2xs tracking-[0.18em] uppercase no-underline transition-colors duration-500',
                isActive(link.href) ? 'text-fg' : 'text-fg-subtle hover:text-fg',
              )}
            >
              {link.label}
            </Link>
          ))}
          <span aria-hidden="true" className="h-3 w-px bg-border-strong" />
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-5 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="-my-2 py-2 font-mono text-2xs tracking-[0.18em] text-fg uppercase"
          >
            Menu
          </button>
        </div>
      </div>

      {/*
        Portalled to <body>: a backdrop-filter on the header would otherwise make it
        the containing block for fixed descendants and trap the panel inside it.
      */}
      {open &&
        createPortal(
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="menu-panel fixed inset-0 z-(--z-overlay) flex flex-col overflow-y-auto bg-bg"
          >
            <div className="gutter flex items-center justify-between py-5">
              <span className="font-mono text-xs tracking-[0.3em] text-fg uppercase">
                Triyan Writes
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="-my-2 py-2 pl-4 font-mono text-2xs tracking-[0.18em] text-fg uppercase"
              >
                Close
              </button>
            </div>

            <nav aria-label="Primary" className="gutter flex flex-1 flex-col justify-center py-10">
              <ol className="space-y-1">
                <li>
                  <MenuLink href="/" index="00" label="Home" active={pathname === '/'} order={0} />
                </li>
                {NAV_LINKS.map((link, i) => (
                  <li key={link.href}>
                    <MenuLink
                      href={link.href}
                      index={String(i + 1).padStart(2, '0')}
                      label={link.label}
                      active={isActive(link.href)}
                      order={i + 1}
                    />
                  </li>
                ))}
              </ol>
            </nav>

            <div className="gutter flex items-end justify-between gap-6 border-t border-border py-6">
              <p className="max-w-[14rem] font-display text-lg leading-snug font-light text-fg-muted italic">
                soul is deeper than the abyss
              </p>
              <ThemeToggle />
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}

function MenuLink({
  href,
  index,
  label,
  active,
  order,
}: {
  href: string;
  index: string;
  label: string;
  active: boolean;
  order: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={{ '--menu-step': order } as React.CSSProperties}
      className="menu-item group flex items-baseline gap-5 py-1.5 no-underline"
    >
      <span className="w-6 font-mono text-2xs text-fg-subtle tabular-nums">{index}</span>
      <span
        className={cn(
          'text-[clamp(2.25rem,11vw,3.5rem)] leading-none tracking-tight transition-colors',
          label === 'ABYSS' ? 'font-abyss font-normal' : 'font-display font-light',
          active ? 'text-fg' : 'text-fg-muted group-hover:text-fg',
        )}
      >
        {label === 'ABYSS' ? 'abyss' : label}
      </span>
    </Link>
  );
}
