import Link from '@/lib/link';
import { redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { InstagramMediaDto, SyncStatusDto } from '@triyan/shared';
import { adminFetch } from '@/features/admin/fetch';
import { InstagramControls, InstagramRows } from '@/features/admin/instagram-admin';

export async function loader({ request }: LoaderFunctionArgs) {
  const review = new URL(request.url).searchParams.get('review') === '1';
  const [status, posts] = await Promise.all([
    adminFetch<SyncStatusDto>('/admin/instagram/sync'),
    adminFetch<InstagramMediaDto[]>(
      `/admin/instagram?limit=60${review ? '&needsReview=true' : ''}`,
    ),
  ]);
  if (status.status === 401) throw redirect('/admin/login');
  return { review, status, posts };
}

export default function AdminInstagramPage() {
  const { review, status, posts } = useLoaderData<typeof loader>();

  return (
    <main id="main" className="gutter mx-auto max-w-6xl py-12">
      <nav className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
        <Link href="/admin" className="no-underline hover:text-fg">
          ← Writings
        </Link>
      </nav>
      <h1 className="mt-6 font-display text-3xl font-light tracking-tight">Instagram</h1>

      {status.status === 503 || !status.data ? (
        <p role="alert" className="mt-6 font-ui text-xs text-ember">
          The API is not reachable. Sync status cannot be loaded.
        </p>
      ) : (
        <InstagramControls status={status.data} />
      )}

      <div className="mt-12 flex gap-6 font-ui text-2xs tracking-widest uppercase">
        <Link
          href="/admin/instagram"
          className={`no-underline ${review ? 'text-fg-subtle' : 'text-fg'}`}
        >
          All
        </Link>
        <Link
          href="/admin/instagram?review=1"
          className={`no-underline ${review ? 'text-fg' : 'text-fg-subtle'}`}
        >
          Needs review
        </Link>
      </div>

      {posts.data && posts.data.length > 0 ? (
        <InstagramRows posts={posts.data} />
      ) : (
        <p className="mt-10 font-reading text-fg-subtle">
          No posts stored{review ? ' that need review' : ''}.
        </p>
      )}
    </main>
  );
}
