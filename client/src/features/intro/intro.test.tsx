import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const setZoom = vi.fn();
const dispose = vi.fn();
let webgl = true;
vi.mock('./black-hole', () => ({
  createBlackHole: (_canvas: HTMLCanvasElement, onFirstFrame: () => void) => {
    if (!webgl) return null;
    onFirstFrame();
    return { setZoom, dispose };
  },
}));

import { Intro, introInitScript } from './intro';

const runInit = () => new Function(introInitScript)() as void;

const media = (reduced: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string) =>
      ({ matches: q.includes('reduce') ? reduced : false, media: q }) as MediaQueryList,
  );

beforeEach(() => {
  webgl = true;
  sessionStorage.clear();
  delete document.documentElement.dataset.intro;
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  window.history.pushState({}, '', '/');
  media(false);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('introInitScript (runs before first paint)', () => {
  it('plays on the homepage, on the first visit of a session', () => {
    runInit();
    expect(document.documentElement.dataset.intro).toBe('play');
  });

  it('never covers a deep link', () => {
    window.history.pushState({}, '', '/writings/a-poem');
    runInit();
    expect(document.documentElement.dataset.intro).toBeUndefined();
  });

  it('plays only once per session', () => {
    sessionStorage.setItem('triyan.intro', '1');
    runInit();
    expect(document.documentElement.dataset.intro).toBeUndefined();
  });

  it('respects reduced motion', () => {
    media(true);
    runInit();
    expect(document.documentElement.dataset.intro).toBeUndefined();
  });

  it('does nothing without WebGL', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    runInit();
    expect(document.documentElement.dataset.intro).toBeUndefined();
  });
});

describe('Intro', () => {
  const mountSite = () => {
    const site = document.createElement('div');
    site.id = 'site';
    document.body.appendChild(site);
    return site;
  };

  it('does not touch the page when it is not playing', () => {
    const site = mountSite();
    render(<Intro />);
    expect(site.hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('locks the page behind it while it plays', () => {
    const site = mountSite();
    document.documentElement.dataset.intro = 'play';
    render(<Intro />);
    expect(site.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
  });

  it('gets out of the way at once if WebGL fails', () => {
    webgl = false;
    const site = mountSite();
    document.documentElement.dataset.intro = 'play';
    render(<Intro />);
    expect(document.documentElement.dataset.intro).toBeUndefined();
    expect(site.hasAttribute('inert')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each(['skip', 'escape'])('falls in and finishes on %s', async (how) => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'performance',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
    const site = mountSite();
    document.documentElement.dataset.intro = 'play';
    render(<Intro />);
    if (how === 'skip') fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    else fireEvent.keyDown(document, { key: 'Escape' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(setZoom).toHaveBeenCalled();
    expect(Math.max(...setZoom.mock.calls.map((c) => c[0] as number))).toBeGreaterThan(10);
    expect(document.documentElement.dataset.intro).toBeUndefined();
    expect(site.hasAttribute('inert')).toBe(false);
    expect(sessionStorage.getItem('triyan.intro')).toBe('1');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
