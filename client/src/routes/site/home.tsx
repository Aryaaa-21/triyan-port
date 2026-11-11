import type { WritingDto } from '@triyan/shared';
import { fetchWritings } from '@/features/writings/api';
import { fetchAboutSafely, fetchAbyssSafely, fetchBookSafely } from '@/features/content/api';
import { fetchInstagramSafely } from '@/features/instagram/api';
import { HomeOpening } from '@/features/home/opening';
import { HomeHero } from '@/features/home/hero';
import { WordsWall } from '@/features/home/words-wall';
import { ArchiveIntro } from '@/features/home/archive-intro';
import { ArchiveStatement } from '@/features/home/archive-statement';
import { BookFeature } from '@/features/home/book-feature';
import { InstagramFeature } from '@/features/home/instagram-feature';
import { AboutIntro, AbyssDoor, ContactDoor, Exit } from '@/features/home/closing';
import { useLoaderData } from 'react-router';
import { Meta } from '@/lib/meta';

const safeWritings = async (query: Parameters<typeof fetchWritings>[0]): Promise<WritingDto[]> =>
  fetchWritings(query)
    .then((r) => r.data)
    .catch(() => []);

/**
 * The homepage is a sequence, not a stack of sections:
 * entry → Triyan → words → archive → the book → Instagram → ABYSS → about →
 * contact → exit. Each chapter is its own component; every piece of content comes
 * from the API, and a missing piece shows as reserved space, never as a stand-in.
 */
export async function loader() {
  const [featured, recent, about, book, abyss, featuredPosts, latestPosts] = await Promise.all([
    safeWritings({ featured: 'true', page: '1' }),
    safeWritings({ page: '1' }),
    fetchAboutSafely(),
    fetchBookSafely(),
    fetchAbyssSafely(),
    fetchInstagramSafely({ limit: '3', featured: 'true' }),
    fetchInstagramSafely({ limit: '3' }),
  ]);
  return { featured, recent, about, book, abyss, featuredPosts, latestPosts };
}

export default function HomePage() {
  const { featured, recent, about, book, abyss, featuredPosts, latestPosts } =
    useLoaderData<typeof loader>();
  // Curated first (Triyan prefers selected posts, Q24); the latest only if none are featured.
  const posts = featuredPosts.length > 0 ? featuredPosts : latestPosts;

  // Featured writings lead; recent ones fill the wall to six.
  const seen = new Set<string>();
  const wall = [...featured, ...recent]
    .filter((w) => (seen.has(w.slug) ? false : (seen.add(w.slug), true)))
    .slice(0, 6);

  return (
    <main id="main">
      <Meta
        absoluteTitle="Triyan Writes — Poet, Writer, Author"
        description="The writing of Triyan — poetry on love, grief, absence, mortality and existence, in English and Hindi."
        canonical="/"
        ogTitle="Triyan Writes"
        ogDescription="An archive of everything that words cannot contain."
      />
      <HomeOpening line="A soul is deeper than the abyss…" />
      <HomeHero about={about} />
      <WordsWall writings={wall} />
      <ArchiveStatement
        statement={about?.statement || 'An archive of everything that words cannot contain.'}
      />
      <ArchiveIntro />
      <BookFeature book={book} />
      <InstagramFeature posts={posts} profileUrl={about?.links.literaryInstagram} />
      <AbyssDoor abyss={abyss} />
      <AboutIntro about={about} />
      <ContactDoor />
      <Exit />
    </main>
  );
}
