import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CATEGORY_KEYS } from '@triyan/shared';
import { ART_CAPTIONS, CategoryArt } from './category-art';
import { CategoryPlate } from './category-plate';

afterEach(cleanup);

describe('CategoryArt', () => {
  it.each(CATEGORY_KEYS)('draws artwork for %s, compactly', (key) => {
    const { container } = render(<CategoryArt category={key} />);
    const svg = container.querySelector('svg');
    // More than the ground and the grain: the category actually drew something…
    expect(svg!.querySelectorAll('*').length).toBeGreaterThan(3);
    // …without hundreds of nodes: strokes are merged into a few paths.
    expect(svg!.querySelectorAll('*').length).toBeLessThan(40);
    expect(container.innerHTML.length).toBeLessThan(12_000);
  });

  it('is decorative by default, so it never repeats the label beside it', () => {
    const { container } = render(<CategoryArt category="GRIEF_MELANCHOLY" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('describes what it shows when it stands alone', () => {
    render(<CategoryArt category="GRIEF_MELANCHOLY" decorative={false} />);
    expect(screen.getByRole('img', { name: ART_CAPTIONS.GRIEF_MELANCHOLY })).toBeTruthy();
  });

  it('is deterministic: the same category always draws the same picture', () => {
    const a = render(<CategoryArt category="HUMAN_CONDITION" />).container.innerHTML;
    cleanup();
    const b = render(<CategoryArt category="HUMAN_CONDITION" />).container.innerHTML;
    expect(a).toBe(b);
  });

  it('paints with theme tokens, never colour literals', () => {
    const html = render(<CategoryArt category="GRIEF_MELANCHOLY" />).container.innerHTML;
    expect(html).toContain('var(--art-ink)');
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('CategoryPlate', () => {
  it('uses generated artwork when no photograph is supplied', () => {
    const { container } = render(<CategoryPlate category="EXISTENTIALISM" />);
    expect(container.querySelector('svg.category-art')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });
});
