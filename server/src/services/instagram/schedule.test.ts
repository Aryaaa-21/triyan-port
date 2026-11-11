import { describe, expect, it } from 'vitest';
import { intervalFromCron } from './schedule.js';

describe('intervalFromCron', () => {
  it('reads */N minute schedules', () => {
    expect(intervalFromCron('*/30 * * * *')).toBe(30 * 60_000);
    expect(intervalFromCron('*/15 * * * *')).toBe(15 * 60_000);
  });
  it('never polls more often than every five minutes', () => {
    expect(intervalFromCron('*/1 * * * *')).toBe(5 * 60_000);
  });
  it('falls back to thirty minutes for unsupported expressions', () => {
    expect(intervalFromCron('0 3 * * 1')).toBe(30 * 60_000);
  });
});
