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
import { SEED_ABOUT, SEED_ABYSS, SEED_BOOK, SEED_SETTINGS } from '../content/seed.js';

const main = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await connectDatabase();

  await updateAbout(SEED_ABOUT);

  await updateBook(SEED_BOOK);

  await updateAbyss(SEED_ABYSS);

  await updateSettings(SEED_SETTINGS);

  console.log('Content seeded. Unsupplied facts were left empty on purpose.');
  await disconnectDatabase();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
