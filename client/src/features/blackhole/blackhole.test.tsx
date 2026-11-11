import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { decideTier } from './capability';
import { BLACK_HOLE_FRAGMENT } from './black-hole';

const base = {
  reducedMotion: false,
  saveData: false,
  webgl: true,
  cores: 8,
  memoryGb: 8,
  width: 1440,
  coarsePointer: false,
};

describe('decideTier', () => {
  it('runs at full quality on a capable desktop', () => {
    expect(decideTier(base)).toBe('high');
  });
  it('drops quality on phones, touch and modest CPUs', () => {
    expect(decideTier({ ...base, width: 390 })).toBe('low');
    expect(decideTier({ ...base, coarsePointer: true })).toBe('low');
    expect(decideTier({ ...base, cores: 4 })).toBe('low');
  });
  it('is off without WebGL, on Save-Data, and on very low memory', () => {
    expect(decideTier({ ...base, webgl: false })).toBe('off');
    expect(decideTier({ ...base, saveData: true })).toBe('off');
    expect(decideTier({ ...base, memoryGb: 1 })).toBe('off');
  });
});

describe('black hole shader', () => {
  it('declares every uniform the renderer sets', () => {
    for (const u of ['uRes', 'uTime', 'uScale', 'uZoom', 'uOffset', 'uPointer']) {
      expect(BLACK_HOLE_FRAGMENT).toContain(`uniform`);
      expect(BLACK_HOLE_FRAGMENT).toContain(u);
    }
  });
  it('has the animated layers: lensed stars, sparkles, shooting stars, infall, orbiters', () => {
    for (const fn of ['starField', 'glitterPops', 'shootingStars', 'infall', 'orbiters']) {
      expect(BLACK_HOLE_FRAGMENT).toContain(`${fn}(`);
    }
  });
  it('colours the disk in the front-page palette: ember, salmon, peach, cream', () => {
    expect(BLACK_HOLE_FRAGMENT).toContain('vec3 diskColour(float v)');
    for (const stop of ['ember', 'salmon', 'peach', 'cream'])
      expect(BLACK_HOLE_FRAGMENT).toContain(stop);
  });

  it('can draw only the living layers, over a photograph of the hole', () => {
    expect(BLACK_HOLE_FRAGMENT).toContain('uniform float uOverlay');
    expect(BLACK_HOLE_FRAGMENT).toContain('vec3 overlayLayers(');
  });

  it('keeps the overlay in pure greys, for the black-and-white opening', () => {
    const start = BLACK_HOLE_FRAGMENT.indexOf('vec3 overlayLayers(');
    const body = BLACK_HOLE_FRAGMENT.slice(start, BLACK_HOLE_FRAGMENT.indexOf('void main()'));
    const colours = [...body.matchAll(/vec3\(([\d.,\s]+)\)/g)].map((m) =>
      (m[1] ?? '').split(',').map((v) => Number(v.trim())),
    );
    expect(colours.length).toBeGreaterThan(0);
    for (const c of colours) expect(new Set(c).size).toBe(1);
  });

  it('crushes empty space to exact black', () => {
    expect(BLACK_HOLE_FRAGMENT).toContain('col *= smoothstep(0.012, 0.03, m);');
  });
});

/* -------------------------------------------------------------- component */

const hole = {
  start: vi.fn(),
  stop: vi.fn(),
  still: vi.fn(),
  setZoom: vi.fn(),
  setPointer: vi.fn(),
  dispose: vi.fn(),
};
let webglAvailable = true;
vi.mock('./black-hole', async (orig) => ({
  ...(await orig<typeof import('./black-hole')>()),
  createBlackHole: () => (webglAvailable ? hole : null),
}));

const media = (reduced: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string) =>
      ({ matches: q.includes('reduce') ? reduced : false, media: q }) as MediaQueryList,
  );

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

beforeEach(() => {
  webglAvailable = true;
  Object.values(hole).forEach((f) => f.mockClear());
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
  media(false);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const PHOTO = { width: 1560, height: 1000, radius: 146 };

const mount = async (props: { cover?: typeof PHOTO } = {}) => {
  const { BlackHoleBackground } = await import('./background');
  return render(
    <section data-scroll-scene style={{ position: 'relative', width: 800, height: 600 }}>
      <BlackHoleBackground {...props} />
    </section>,
  );
};

describe('BlackHoleBackground', () => {
  it('is a decorative layer that never takes pointer input', async () => {
    const { container } = await mount();
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.className).toContain('pointer-events-none');
  });

  it('animates only while on screen', async () => {
    await mount();
    FakeIO.last?.cb([{ isIntersecting: true }]);
    expect(hole.start).toHaveBeenCalled();
    FakeIO.last?.cb([{ isIntersecting: false }]);
    expect(hole.stop).toHaveBeenCalled();
  });

  it('draws one still frame under reduced motion, and never loops', async () => {
    media(true);
    await mount();
    expect(hole.still).toHaveBeenCalledTimes(1);
    expect(hole.start).not.toHaveBeenCalled();
  });

  it('falls back to the still image when WebGL is unavailable', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container } = await mount();
    expect((container.firstElementChild as HTMLElement).dataset.webgl).toBe('none');
  });

  it('falls back when the shader cannot be set up', async () => {
    webglAvailable = false;
    const { container } = await mount();
    expect((container.firstElementChild as HTMLElement).dataset.webgl).toBe('none');
  });

  it('over a photograph, screen-blends its effects and lets the photo stand alone without WebGL', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container } = await mount({ cover: PHOTO });
    const scene = container.firstElementChild as HTMLElement;
    expect(scene.querySelector('canvas')?.className).toContain('mix-blend-screen');
    expect(scene.dataset.webgl).toBeUndefined();
  });

  it('gives the scroll scene its progress and zoom, so the photo can fall with the stars', async () => {
    const { container } = await mount({ cover: PHOTO });
    const scene = container.firstElementChild as HTMLElement;
    expect(scene.style.getPropertyValue('--bh-progress')).toBe('0.0000');
    expect(scene.style.getPropertyValue('--bh-zoom')).toBe('1.0000');
  });
});
