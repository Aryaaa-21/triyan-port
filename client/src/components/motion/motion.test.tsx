import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SplitText } from './split-text';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SplitText', () => {
  it('gives assistive technology the whole word once', () => {
    render(
      <h1>
        <SplitText text="Abyss" />
      </h1>,
    );
    expect(screen.getByRole('heading', { name: 'Abyss' })).toBeTruthy();
  });

  it('hides the individual letters from assistive technology', () => {
    const { container } = render(<SplitText text="Ab c" />);
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden?.querySelectorAll('.split-char')).toHaveLength(4);
    // Spaces survive as non-breaking so the word shape is kept.
    expect(hidden?.textContent).toContain(' ');
  });

  it('staggers letters through a CSS variable, with no JavaScript timing', () => {
    const { container } = render(<SplitText text="ab" delay={100} step={50} />);
    const chars = container.querySelectorAll<HTMLElement>('.split-char');
    expect(chars[0]?.style.getPropertyValue('--split-delay')).toBe('100ms');
    expect(chars[1]?.style.getPropertyValue('--split-delay')).toBe('150ms');
  });
});

describe('Cursor', () => {
  const media = (fine: boolean) =>
    vi.stubGlobal(
      'matchMedia',
      (q: string) =>
        ({
          matches: q.includes('fine') || q.includes('hover: hover') ? fine : false,
          media: q,
        }) as unknown as MediaQueryList,
    );

  it('is decorative and never blocks pointer input', async () => {
    media(true);
    const { Cursor } = await import('./cursor');
    const { container } = render(<Cursor />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.dataset.visible).toBe('false');
  });

  it('stays dormant on touch devices', async () => {
    media(false);
    const { Cursor } = await import('./cursor');
    const { container } = render(<Cursor />);
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }));
    expect((container.firstElementChild as HTMLElement).dataset.visible).toBe('false');
  });

  it('does not hide the system cursor anywhere', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(`${process.cwd()}/src/styles/globals.css`, 'utf8');
    expect(css).not.toMatch(/cursor:\s*none/);
  });
});
