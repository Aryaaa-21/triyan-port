import { describe, expect, it } from 'vitest';
import { BLACK_HOLE_FRAGMENT } from './black-hole';

describe('black hole shader', () => {
  it('declares the uniforms the renderer sets', () => {
    for (const u of ['uRes', 'uTime', 'uScale', 'uZoom']) expect(BLACK_HOLE_FRAGMENT).toContain(u);
  });

  it('is monochrome: every output channel is the same value', () => {
    expect(BLACK_HOLE_FRAGMENT).toMatch(/gl_FragColor\s*=\s*vec4\(vec3\(v\),\s*1\.0\)/);
  });

  it('draws stars through the lens, behind the disk', () => {
    expect(BLACK_HOLE_FRAGMENT).toContain('starField(q * S, t, px * S)');
    expect(BLACK_HOLE_FRAGMENT).toMatch(/thetaE/);
  });

  it('crushes empty space to exact black', () => {
    expect(BLACK_HOLE_FRAGMENT).toContain('v *= smoothstep(0.012, 0.03, v);');
  });
});
