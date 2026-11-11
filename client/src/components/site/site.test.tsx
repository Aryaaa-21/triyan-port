import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { SiteFooter } from './site-footer';
import { NAV_LINKS } from './nav-links';

// next/navigation is not available outside the app runtime.
vi.mock('next/navigation', () => ({
  usePathname: () => '/writings',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

describe('navigation destinations', () => {
  it('exposes the core destinations exactly once each', () => {
    const hrefs = NAV_LINKS.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toEqual(['/writings', '/book', '/about', '/abyss', '/contact']);
  });

  it('every destination is an internal absolute path', () => {
    for (const link of NAV_LINKS) expect(link.href.startsWith('/')).toBe(true);
  });
});

describe('SiteHeader', () => {
  it('marks the current section and opens an accessible mobile panel', async () => {
    const { SiteHeader } = await import('./site-header');
    render(<SiteHeader />);

    // Desktop nav marks the active route.
    const current = screen.getAllByRole('link', { name: 'Writings' })[0];
    expect(current?.getAttribute('aria-current')).toBe('page');

    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(menu);
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('closes the mobile panel on Escape', async () => {
    const { SiteHeader } = await import('./site-header');
    render(<SiteHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.queryByRole('dialog')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('SiteFooter', () => {
  it('lists every primary destination', () => {
    render(<SiteFooter />);
    for (const link of NAV_LINKS) {
      expect(screen.getByRole('link', { name: link.label })).toBeTruthy();
    }
  });

  it('omits Instagram and Email when they have not been supplied', () => {
    render(<SiteFooter />);
    expect(screen.queryByRole('link', { name: 'Instagram' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Email' })).toBeNull();
  });

  it('shows them once supplied', () => {
    render(
      <SiteFooter literaryInstagram="https://www.instagram.com/triyanwrites" email="a@b.test" />,
    );
    expect(screen.getByRole('link', { name: 'Instagram' }).getAttribute('href')).toContain(
      'triyanwrites',
    );
    expect(screen.getByRole('link', { name: 'Email' }).getAttribute('href')).toBe(
      'mailto:a@b.test',
    );
  });
});

describe('ThemeToggle', () => {
  it('switches the environment and persists the choice', async () => {
    const { ThemeToggle } = await import('./theme-toggle');
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    expect(localStorage.getItem('triyan.theme')).toBe(
      document.documentElement.getAttribute('data-theme'),
    );
  });
});
