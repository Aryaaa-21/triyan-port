import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { Typewriter } from './typewriter';

class FakeIO {
  static last: FakeIO | null = null;
  cb: (e: { isIntersecting: boolean }[]) => void;
  constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
    this.cb = cb;
    FakeIO.last = this;
  }
  observe() {}
  disconnect() {}
}

const media = (reduced: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string) =>
      ({ matches: q.includes('reduce') ? reduced : false, media: q }) as MediaQueryList,
  );

const segments = [{ text: 'An archive.' }, { text: ' Poetry, on grief.', className: 'block' }];

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', FakeIO);
  media(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Typewriter', () => {
  it('always holds the whole text, so nothing reflows and screen readers read it all', () => {
    const { container } = render(<Typewriter segments={segments} />);
    expect(container.textContent).toBe('An archive. Poetry, on grief.');
  });

  it('waits until it is in view, types it out, and ends with the caret after the last word', () => {
    const { container } = render(<Typewriter segments={segments} />);
    expect(container.querySelector('.typewriter-rest')?.textContent).toBe('An archive.');
    act(() => FakeIO.last?.cb([{ isIntersecting: true }]));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(container.querySelector('.typewriter-rest')).toBeNull();
    expect(container.querySelector('.block .typewriter-caret')).not.toBeNull();
  });

  it('under reduced motion, the text is simply there, with no caret', () => {
    media(true);
    const { container } = render(<Typewriter segments={segments} />);
    expect(container.querySelector('.typewriter-rest')).toBeNull();
    expect(container.querySelector('.typewriter-caret')).toBeNull();
  });
});
