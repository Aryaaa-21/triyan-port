import Link from '@/lib/link';
import { redirect, useLoaderData } from 'react-router';
import type { SubscriberDto, SubscriberSummary } from '@triyan/shared';
import { adminFetch } from '@/features/admin/fetch';
import { SubscriberList } from '@/features/admin/subscriber-list';

export async function loader() {
  const result = await adminFetch<SubscriberDto[]>('/admin/subscribers');
  if (result.status === 401) throw redirect('/admin/login');
  return result;
}

/** The people who asked to be emailed about new writings. */
export default function AdminSubscribersPage() {
  const result = useLoaderData<typeof loader>();
  const subscribers = result.data ?? [];
  const summary = result.meta as SubscriberSummary | undefined;

  return (
    <main id="main" className="gutter mx-auto max-w-5xl py-12">
      <nav className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        <Link href="/admin" className="no-underline hover:text-fg">
          ← Writings
        </Link>
      </nav>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-light tracking-tight">Subscribers</h1>
        {(summary?.active ?? 0) > 0 && (
          <a
            href="/api/v1/admin/subscribers.csv"
            className="font-mono text-xs tracking-[0.2em] text-fg uppercase no-underline hover:text-accent"
          >
            Export CSV ↓
          </a>
        )}
      </div>
      {summary && (
        <p className="mt-2 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
          {summary.active} confirmed · {summary.pending} awaiting confirmation ·{' '}
          {summary.unsubscribed} unsubscribed
        </p>
      )}

      {summary && !summary.mailEnabled && (
        <p
          role="note"
          className="mt-8 max-w-2xl border-l border-border-strong py-1 pl-5 font-reading text-base leading-prose text-fg-muted"
        >
          Email is not connected yet, so nothing can be sent. People can still sign up, and they are
          kept here. To start sending, set EMAIL_PROVIDER, its API key and EMAIL_FROM on the server.
        </p>
      )}

      {result.status === 503 ? (
        <p role="alert" className="mt-6 font-mono text-xs text-ember">
          The API is not reachable. Subscribers cannot be loaded.
        </p>
      ) : subscribers.length === 0 ? (
        <p className="mt-10 font-reading text-lg text-fg-subtle">
          No one yet. Anyone who signs up from the site appears here.
        </p>
      ) : (
        <SubscriberList subscribers={subscribers} />
      )}

      <p className="mt-10 max-w-2xl font-ui text-xs leading-relaxed text-fg-subtle">
        To email a writing to confirmed subscribers, open it in the editor: tick “Email this to
        subscribers when I publish”, or use “Email this to subscribers” on a piece that is already
        live. Each writing can be sent once.
      </p>
    </main>
  );
}
