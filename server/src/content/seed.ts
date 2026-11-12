/**
 * What the owner has actually supplied about himself, the book and ABYSS, and nothing
 * else. `seed:content` writes these into the database; with no database, the site
 * serves them as they are (see archive/store.ts).
 *
 * Every field traces to something Triyan stated. Fields that have not been supplied are
 * left out on purpose: the pages render an empty field as absent, never as a placeholder.
 *
 * Deliberately NOT stored: age, birth year, follower counts, awards, achievements.
 */

export const SEED_ABOUT = {
  displayName: 'Triyan',
  literaryIdentity: 'Triyan Writes',
  writingSince: '2016',
  statement: 'An archive of everything that words cannot contain.',
  // Supplied by the owner (2026-11-11), served from client/public/images.
  portraitUrl: '/images/triyan.jpg',
  // Triyan's own words (questionnaire Q3, Q5, Q6/Q8, Q10, Q59), first person.
  body: [
    "I'm a poet and writer drawn towards the deeper, often unexplored dimensions of human existence. My writing explores love, grief, absence, mortality and the contradictions of being human. I believe words can express things that ordinary language often fails to contain.",
    '',
    'Writing became a way of expressing thoughts and emotions that were difficult to articulate otherwise. It gradually became more than an outlet; it became a way of understanding existence, relationships and the human condition.',
    '',
    'I write poetry — primarily traditional-style poetry, dark romanticism, and philosophical and existential writing — mostly in English and Hindi.',
    '',
    "I've been building my identity as a poet through my writing and my Instagram platform, Triyan Writes. What started as personal expression gradually developed into a creative space with a growing readership. My ambition is to take that identity beyond social media through books, literature and other creative ventures.",
    '',
    "I'm not simply a poet publishing words on the internet. I'm building a creative identity around literature, philosophy, art and different forms of expression. My writing is one part of a much larger vision.",
  ].join('\n'),
  links: {
    literaryInstagram: 'https://www.instagram.com/triyanwrites',
    // Not listed by the owner as a public account (Q54), so not shown.
    personalInstagram: '',
    // Not supplied. The contact page shows the form only until it is.
    email: '',
  },
};

export const SEED_BOOK = {
  title: 'Leaving and Living',
  description: [
    'A collection of poetry exploring love, loss, longing, grief, existence, and the complicated nature of being human.',
  ].join('\n'),
  audience:
    'People who feel deeply, question existence, find themselves in silence, and recognise emotions that are difficult to explain.',
  salesLine:
    "If you've ever felt something you couldn't explain, perhaps you'll find a part of yourself within these pages.",
  // Q36–Q37: publishing, distribution and Amazon availability are 'to be confirmed',
  // so no purchase link is shown until they are.
  purchaseUrl: '',
  published: true,
  // The owner's jacket artwork: the front panel, cut from the full wrap in
  // client/public/images/book-jacket.jpg.
  coverImageUrl: '/images/book-cover.jpg',
  // Printed on that jacket.
  publisher: "Writer's Pocket",
  isbn: '978-93-7903-419-9',
  // Left empty until supplied: price, publicationDate, formats, reviews, excerptSlugs.
};

export const SEED_ABYSS = {
  name: 'ABYSS',
  tagline: 'soul is deeper than the abyss',
  philosophy: 'because once you enter the abyss you cannot leave.',
  // Q44 and Q50.
  direction: 'ABYSS begins with oversized gothic shirts, with more to be added in the future.',
  comingSoonNote: 'Launch date to be announced.',
  published: true,
};

export const SEED_SETTINGS = {
  siteTitle: 'Triyan',
  tagline: 'Poet. Writer. Author.',
  defaultSeoDescription:
    'The writing of Triyan — poetry on love, grief, absence, mortality and existence, in English and Hindi.',
};
