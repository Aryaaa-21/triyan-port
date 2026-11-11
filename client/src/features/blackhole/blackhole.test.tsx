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
  it('is monochrome and crushes empty space to exact black', () => {
    expect(BLACK_HOLE_FRAGMENT).toMatch(/gl_FragColor\s*=\s*vec4\(vec3\(v\),\s*1\.0\)/);
    expect(BLACK_HOLE_FRAGMENT).toContain('v *= smoothstep(0.012, 0.03, v);');
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

const mount = async () => {
  const { BlackHoleBackground } = await import('./background');
  return render(
    <section style={{ position: 'relative', width: 800, height: 600 }}>
      <BlackHoleBackground />
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
});
