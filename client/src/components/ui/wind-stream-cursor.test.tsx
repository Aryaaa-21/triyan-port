import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import WindStreamCursor from './wind-stream-cursor';

const media = (fine: boolean, reduced: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string) =>
      ({
        matches: q.includes('pointer: fine') ? fine : q.includes('reduce') ? reduced : false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const host = (ui: React.ReactNode) =>
  render(<div style={{ position: 'relative', width: 400, height: 300 }}>{ui}</div>);

describe('WindStreamCursor', () => {
  it('is a decorative overlay that never takes pointer input', () => {
    media(true, false);
    const { container } = host(<WindStreamCursor />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.style.pointerEvents).toBe('none');
  });

  it('never hides the system cursor', () => {
    media(true, false);
    const { container } = host(<WindStreamCursor />);
    expect(container.innerHTML).not.toMatch(/cursor:\s*none/);
  });

  it.each([
    ['touch devices', false, false],
    ['reduced motion', true, true],
  ])('stays dormant on %s', (_label, fine, reduced) => {
    media(fine, reduced);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    host(<WindStreamCursor />);
    expect(getContext).not.toHaveBeenCalled();
  });

  it('paints with theme greys, never a hard-coded colour', () => {
    const source = readFileSync(
      `${process.cwd()}/src/components/ui/wind-stream-cursor.tsx`,
      'utf8',
    );
    expect(source).not.toMatch(/\b(hsla?|rgba?)\(/);
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).toContain('--wind-strong');
  });
});
