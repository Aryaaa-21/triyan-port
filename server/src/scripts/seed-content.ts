/**
 * Seeds the singleton content documents with information the owner has actually
 * supplied, and nothing else.
 *
 *   npm run seed:content -w @triyan/server
 *
 * Every field below traces to something Triyan stated. Fields that have not been
 * supplied — publisher, ISBN, price, publication date, formats, reviews, cover image,
 * contact email — are left empty on purpose. The pages render an empty field as
 * absent rather than as a placeholder, so nothing invented can reach a reader.
 *
 * Deliberately NOT stored: age, birth year, follower counts, awards, achievements.
 * The owner supplied "since I was 10, 2016"; stating both publicly would disclose a
 * birth year, so only the year is kept. Follower and view counts were supplied but
 * are left out at the owner's own request not to be presented as a social media poet.
 */
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import {
  updateAbout,
  updateAbyss,
  updateBook,
  updateSettings,
} from '../services/content.service.js';

const main = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await connectDatabase();

  await updateAbout({
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
  });

  await updateBook({
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
    // Left empty until supplied: coverImageUrl, publisher, isbn, price,
    // publicationDate, formats, reviews, excerptSlugs.
  });

  await updateAbyss({
    name: 'ABYSS',
    tagline: 'soul is deeper than the abyss',
    philosophy: 'because once you enter the abyss you cannot leave.',
    // Q44 and Q50.
    direction: 'ABYSS begins with oversized gothic shirts, with more to be added in the future.',
    comingSoonNote: 'Launch date to be announced.',
    published: true,
  });

  await updateSettings({
    siteTitle: 'Triyan',
    tagline: 'Poet. Writer. Author.',
    defaultSeoDescription:
      'The writing of Triyan — poetry on love, grief, absence, mortality and existence, in English and Hindi.',
  });

  console.log('Content seeded. Unsupplied facts were left empty on purpose.');
  await disconnectDatabase();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
