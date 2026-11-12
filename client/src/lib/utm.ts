/**
 * Campaign tags. When a reader arrives through a tagged link (`?utm_source=instagram&…`),
 * the tags are remembered for the visit — in this tab only, never in a cookie — so a
 * message sent from the contact form can say where its sender came from.
 */
const KEY = 'triyan-arrival';
const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** `utm_source=instagram&utm_campaign=book` → "instagram / book". */
export const readCampaign = (search: string): string => {
  const params = new URLSearchParams(search);
  return TAGS.map((tag) => (params.get(tag) ?? '').trim())
    .filter(Boolean)
    .join(' / ')
    .slice(0, 200);
};

/** Call once on arrival. The first tagged link of a visit wins. */
export const rememberCampaign = (): void => {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const campaign = readCampaign(window.location.search);
    if (campaign) sessionStorage.setItem(KEY, campaign);
  } catch {
    // Storage is blocked: the visit simply carries no tag.
  }
};

export const recallCampaign = (): string => {
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};
