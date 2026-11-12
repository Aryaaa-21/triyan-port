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

  it('rests part-way through its scroll scene, then carries on to the section', () => {
    media(false);
    vi.useFakeTimers();
    vi.stubGlobal('innerHeight', 1000);
    // Frames run at once, each a full leg later, so every leg completes in one step.
    let clock = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      clock += 10_000;
      cb(clock);
      return 1;
    });
    const { getByRole, getByText } = render(
      <>
        <section data-scroll-scene>
          <ScrollCue target="next" rest={{ at: 0.5, ms: 2600 }}>
            Scroll to enter
          </ScrollCue>
        </section>
        <section id="next" tabIndex={-1}>
          Next
        </section>
      </>,
    );
    const rect = (top: number, height: number) => ({ top, height }) as DOMRect;
    // A scene 3000px tall on a 1000px screen: 2000px of travel, so half-way is 1000.
    vi.spyOn(getByRole('link').closest('section')!, 'getBoundingClientRect').mockReturnValue(
      rect(0, 3000),
    );
    vi.spyOn(getByText('Next'), 'getBoundingClientRect').mockReturnValue(rect(3000, 800));

    fireEvent.click(getByRole('link'));
    const tops = () =>
      vi.mocked(window.scrollTo).mock.calls.map(([arg]) => (arg as ScrollToOptions).top);
    expect(tops().at(-1)).toBe(1000);
    expect(document.activeElement).not.toBe(getByText('Next'));

    vi.advanceTimersByTime(2599);
    expect(tops().at(-1)).toBe(1000);
    vi.advanceTimersByTime(1);
    expect(tops().at(-1)).toBe(3000);
    expect(document.activeElement).toBe(getByText('Next'));
    vi.useRealTimers();
  });

  it('under reduced motion, jumps straight there and moves focus to the section', () => {
    media(true);
    const { getByRole, getByText } = mount();
    fireEvent.click(getByRole('link'));
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
    expect(document.activeElement).toBe(getByText('Next'));
  });
});
