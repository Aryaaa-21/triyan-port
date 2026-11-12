import { describe, expect, it } from 'vitest';
import { pageWindow } from './pager';

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('keeps the ends and the neighbours, with gaps between', () => {
    expect(pageWindow(1, 21)).toEqual([1, 2, 0, 20, 21]);
    expect(pageWindow(10, 21)).toEqual([1, 2, 0, 9, 10, 11, 0, 20, 21]);
    expect(pageWindow(21, 21)).toEqual([1, 2, 0, 20, 21]);
  });
});
