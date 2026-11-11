import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ScrollCue } from './scroll-cue';

const media = (reduced: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string) =>
      ({ matches: q.includes('reduce') ? reduced : false, media: q }) as MediaQueryList,
  );

const mount = () =>
  render(
    <>
      <ScrollCue target="next">Scroll to enter</ScrollCue>
      <section id="next" tabIndex={-1}>
        Next
      </section>
    </>,
  );

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ScrollCue', () => {
  it('is a real link to the section, so it works without JavaScript', () => {
    media(false);
    const { getByRole } = mount();
    expect(getByRole('link', { name: 'Scroll to enter' }).getAttribute('href')).toBe('#next');
  });

  it('glides instead of jumping, frame by frame', () => {
    media(false);
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const { getByRole } = mount();
    const notPrevented = fireEvent.click(getByRole('link'));
    expect(notPrevented).toBe(false);
    expect(raf).toHaveBeenCalled();
  });

  it('under reduced motion, jumps straight there and moves focus to the section', () => {
    media(true);
    const { getByRole, getByText } = mount();
    fireEvent.click(getByRole('link'));
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
    expect(document.activeElement).toBe(getByText('Next'));
  });
});
