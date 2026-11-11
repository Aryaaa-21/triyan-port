/**
 * The ABYSS wordmark in Aquiline Two. A script face reads best in title case, so
 * however the name is stored ("ABYSS"), the mark is set as "Abyss". Navigation and
 * labels keep their own capitals.
 */
export const wordmark = (name: string): string =>
  name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name;
