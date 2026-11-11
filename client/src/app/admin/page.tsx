import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { WritingDto } from '@triyan/shared';
import { adminFetch } from '@/features/admin/server';
import { WritingsTable } from '@/features/admin/writings-table';
import { SignOutButton } from '@/features/admin/sign-out-button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { status, data } = await adminFetch<WritingDto[]>('/admin/writings?limit=60');

  if (status === 401) redirect('/admin/login');

  const writings = data ?? [];
  const drafts = writings.filter((w) => w.status === 'DRAFT').length;
  const published = writings.filter((w) => w.status === 'PUBLISHED').length;

  return (
    <main id="main" className="gutter mx-auto max-w-5xl py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Writings</h1>
          <p className="mt-2 font-ui text-xs text-fg-subtle">
            {published} published · {drafts} {drafts === 1 ? 'draft' : 'drafts'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/instagram"
            className="font-ui text-xs tracking-widest text-fg-muted uppercase no-underline hover:text-fg"
          >
            Instagram
          </Link>
          <Link
            href="/admin/writings/new"
            className="inline-flex items-center rounded-sm bg-fg px-5 py-2.5 font-ui text-sm tracking-wide text-bg uppercase no-underline hover:bg-accent"
          >
            New writing
          </Link>
          <SignOutButton />
        </div>
      </header>

      {status === 503 && (
        <p role="alert" className="mt-6 font-ui text-xs text-ember">
          The API is not reachable. Writings cannot be loaded.
        </p>
      )}

      {writings.length === 0 ? (
        <div className="mt-16 border border-border p-10 text-center">
          <p className="font-display text-xl font-light text-fg-muted">No writings yet</p>
          <p className="mt-2 font-ui text-sm text-fg-subtle">
            Create the first one; it stays a draft until you publish it.
          </p>
        </div>
      ) : (
        <WritingsTable writings={writings} />
      )}
    </main>
  );
}
