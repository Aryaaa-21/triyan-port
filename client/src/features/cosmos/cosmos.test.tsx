import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { decideTier } from './capability';

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
  it('runs the full field on a capable desktop', () => {
    expect(decideTier(base)).toBe('high');
  });
  it('is off under reduced motion', () => {
    expect(decideTier({ ...base, reducedMotion: true })).toBe('off');
  });
  it('is off without WebGL', () => {
    expect(decideTier({ ...base, webgl: false })).toBe('off');
  });
  it('is off when the reader asks to save data', () => {
    expect(decideTier({ ...base, saveData: true })).toBe('off');
  });
  it('is off on very low-memory devices', () => {
    expect(decideTier({ ...base, memoryGb: 1 })).toBe('off');
  });
  it('limits particles on phones and touch devices', () => {
    expect(decideTier({ ...base, width: 390 })).toBe('low');
    expect(decideTier({ ...base, coarsePointer: true })).toBe('low');
    expect(decideTier({ ...base, cores: 4 })).toBe('low');
  });
});

const mockMedia = (matches: (q: string) => boolean) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string) =>
      ({
        matches: matches(q),
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.doUnmock('./scene');
});

describe('CosmicField', () => {
  it('renders a decorative, hidden canvas', async () => {
    mockMedia((q) => q.includes('reduce'));
    const { CosmicField } = await import('./cosmic-field');
    const { container } = render(<CosmicField />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.className).toContain('pointer-events-none');
  });

  it('never loads the 3D scene under reduced motion', async () => {
    mockMedia((q) => q.includes('reduce'));
    const loaded = vi.fn();
    vi.doMock('./scene', () => {
      loaded();
      return { createCosmos: vi.fn() };
    });
    const { CosmicField } = await import('./cosmic-field');
    render(<CosmicField />);
    await new Promise((r) => setTimeout(r, 400));
    expect(loaded).not.toHaveBeenCalled();
  });
});
