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

const AMAZON_URL = 'https://amzn.in/d/09HNrhpE';

export const SEED_BOOK = {
  title: 'Leaving and Living',
  description: [
    'A collection of poetry exploring love, loss, longing, grief, existence, and the complicated nature of being human.',
  ].join('\n'),
  audience:
    'People who feel deeply, question existence, find themselves in silence, and recognise emotions that are difficult to explain.',
  salesLine:
    "If you've ever felt something you couldn't explain, perhaps you'll find a part of yourself within these pages.",
  // Where the book is sold. The first is also the single 'Buy' link.
  purchaseUrl: AMAZON_URL,
  purchaseLinks: [
    { label: 'Amazon', url: AMAZON_URL },
    { label: 'Flipkart', url: 'https://dl.flipkart.com/s/6Rldf_NNNN' },
  ],
  published: true,
  // The owner's jacket artwork: the front panel, cut from the full wrap in
  // client/public/images/book-jacket.jpg.
  coverImageUrl: '/images/book-cover.jpg',
  // Printed on that jacket.
  publisher: "Writer's Pocket",
  isbn: '978-93-7903-419-9',
  // As listed by the shops (and the price as printed on the jacket).
  price: '₹222',
  publicationDate: '2026-10-21T00:00:00.000Z',
  formats: ['Paperback'],
  // Amazon's own figures, read from the listing on 12 November 2026.
  rating: { value: '5.0', count: 5, source: 'Amazon', url: AMAZON_URL },
  // Readers' reviews on Amazon, word for word, each with a screenshot of the original.
  reviews: [
    {
      quote: [
        "The first poetry book that I ever bought and it's worth every penny.",
        'The book doesn\'t follow any sequence, "looks" to be an easy read but it hits hard if you ponder upon it.',
        'It makes you think what is love? is it longing? is it enjoying? is it a memory? is it the hope of meeting again?',
        'Love can be so one-sided yet multi-dimensional.',
        'You can read 20-30 pages on a whim & at the same time just 3 pages can be so much over-whelming if you are able to resonate with the emotions put in.',
      ].join('\n\n'),
      title: 'Love can be so one-sided yet multi-dimensional',
      attribution: 'adarsh',
      source: 'Amazon · Verified Purchase',
      publishedAt: '2026-11-02T00:00:00.000Z',
      imageUrl: '/images/reviews/amazon-review-1.webp',
      imageWidth: 1400,
      imageHeight: 834,
    },
    {
      quote:
        'Impeccably written poems, the gorgeous coverr and great paper qualityyy!! Absolutelyy adoree it and alsoo very excitedd to readd it furtherrr',
      title: 'Great addition to your collection😋',
      attribution: 'Sanskriti',
      source: 'Amazon',
      publishedAt: '2026-10-31T00:00:00.000Z',
      imageUrl: '/images/reviews/amazon-review-2.webp',
      imageWidth: 1400,
      imageHeight: 350,
    },
    {
      quote:
        "this book is so good and it's written by my favorite writer, he's just not a writer he's a person who describes our feelings by beautiful words, he's a person who helps us feel things, he's a person for whom im really proud of, he's literally so talented he is perfect, i recommend y'all to buy this book and read it... this book feels like you're back home and it helps in healing after a cruel moment, I'm proud of you tri you'll make it so big one day. :)",
      title: "it's the best book that feels like a safe place",
      attribution: 'utkarsh',
      source: 'Amazon',
      publishedAt: '2026-10-29T00:00:00.000Z',
      imageUrl: '/images/reviews/amazon-review-3.webp',
      imageWidth: 1400,
      imageHeight: 470,
    },
  ],
  // Left empty until supplied: excerptSlugs.
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
