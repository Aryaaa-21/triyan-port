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
 * The owner supplied "writing since around age 10 / 2016"; stating both publicly
 * would disclose a birth year, so only the year is kept, as free text he controls.
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
    body: [
      'Triyan has been writing since 2016.',
      '',
      'The writing began as a way of holding thoughts that were difficult to say plainly, and became a way of looking at existence, at other people, and at the contradictions a person carries without resolving them.',
      '',
      'It is poetry, mostly — traditional in its forms, dark romantic in its temperament, and philosophical in what it keeps returning to. It is written in English and in Hindi.',
      '',
      'The recurring subjects are love and unrequited love, heartbreak, grief, absence, longing, loneliness and melancholy; mortality and nostalgia; suffering, hope, despair and faith; existence, and the contradictions of being human.',
    ].join('\n'),
    links: {
      literaryInstagram: 'https://www.instagram.com/triyanwrites',
      personalInstagram: 'https://www.instagram.com/triyxnn',
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
    purchaseUrl: 'https://amzn.in/d/06c0R7gp',
    published: true,
    // Left empty until supplied: coverImageUrl, publisher, isbn, price,
    // publicationDate, formats, reviews, excerptSlugs.
  });

  await updateAbyss({
    name: 'ABYSS',
    tagline: 'soul is deeper than the abyss',
    philosophy: 'because once you enter the abyss you cannot leave.',
    direction:
      'ABYSS begins with oversized gothic clothing, and is intended to grow into a wider body of creative work.',
    comingSoonNote: 'Nothing is for sale yet.',
    published: true,
  });

  await updateSettings({
    siteTitle: 'Triyan',
    tagline: 'Poet. Writer.',
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
