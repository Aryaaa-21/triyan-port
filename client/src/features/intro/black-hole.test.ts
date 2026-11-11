import { describe, expect, it } from 'vitest';
import { BLACK_HOLE_FRAGMENT } from './black-hole';

describe('black hole shader', () => {
  it('declares the uniforms the renderer sets', () => {
    for (const u of ['uRes', 'uTime', 'uScale', 'uZoom']) expect(BLACK_HOLE_FRAGMENT).toContain(u);
  });

  it('is monochrome: every output channel is the same value', () => {
    expect(BLACK_HOLE_FRAGMENT).toMatch(/gl_FragColor\s*=\s*vec4\(vec3\(v\),\s*1\.0\)/);
  });
});
