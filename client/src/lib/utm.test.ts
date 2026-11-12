import { describe, expect, it } from 'vitest';
import { readCampaign } from './utm';

describe('readCampaign', () => {
  it('joins the tags that are present, in a fixed order', () => {
    expect(readCampaign('?utm_campaign=book&utm_source=instagram')).toBe('instagram / book');
  });

  it('is empty for an untagged address', () => {
    expect(readCampaign('?page=2')).toBe('');
  });

  it('bounds what it keeps', () => {
    expect(readCampaign(`?utm_source=${'a'.repeat(500)}`).length).toBe(200);
  });
});
