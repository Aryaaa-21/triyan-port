import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ArrowLink, ContentPending, SectionIntro } from './index';

afterEach(cleanup);

describe('ArrowLink', () => {
  it('opens external links safely and says so to screen readers', () => {
    render(
      <ArrowLink href="https://example.test" external>
        Buy
      </ArrowLink>,
    );
    const link = screen.getByRole('link', { name: /buy.*opens in a new tab/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('keeps the arrow out of the accessible name', () => {
    render(<ArrowLink href="/writings">Enter the archive</ArrowLink>);
    expect(screen.getByRole('link', { name: 'Enter the archive' })).toBeTruthy();
  });
});

describe('ContentPending', () => {
  it('says plainly that content is missing, without inventing a stand-in', () => {
    render(<ContentPending>Excerpts will be set here.</ContentPending>);
    expect(screen.getByText(/content to be added/i)).toBeTruthy();
    expect(screen.getByText('Excerpts will be set here.')).toBeTruthy();
  });
});

describe('SectionIntro', () => {
  it('is a decorative chapter marker, hidden from assistive technology', () => {
    const { container } = render(<SectionIntro index="03" label="Words" />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(container.textContent).toContain('03 — Words');
  });
});
