import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ContactMessageDto, WaitlistSubscriberDto } from '@triyan/shared';
import { adminFetch } from '@/features/admin/server';
import { InboxList } from '@/features/admin/inbox-list';

export const dynamic = 'force-dynamic';

/** The owner's inbox: contact messages, and the ABYSS waitlist. */
export default async function AdminInboxPage() {
  const [messages, waitlist] = await Promise.all([
    adminFetch<ContactMessageDto[]>('/admin/inbox'),
    adminFetch<WaitlistSubscriberDto[]>('/admin/waitlist'),
  ]);
  if (messages.status === 401) redirect('/admin/login');

  const unread = (messages.data ?? []).filter((m) => !m.read).length;
  const subscribers = waitlist.data ?? [];

  return (
    <main id="main" className="gutter mx-auto max-w-5xl py-12">
      <nav className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        <Link href="/admin" className="no-underline hover:text-fg">
          ← Writings
        </Link>
      </nav>

      <h1 className="mt-6 font-display text-3xl font-light tracking-tight">Inbox</h1>
      <p className="mt-2 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
        {messages.data?.length ?? 0} messages · {unread} unread
      </p>

      {messages.status === 503 ? (
        <p role="alert" className="mt-6 font-mono text-xs text-ember">
          The API is not reachable. Messages cannot be loaded.
        </p>
      ) : (messages.data ?? []).length === 0 ? (
        <p className="mt-10 font-reading text-lg text-fg-subtle">
          No messages yet. Anything sent through the contact form arrives here.
        </p>
      ) : (
        <InboxList messages={messages.data ?? []} />
      )}

      <section aria-labelledby="waitlist-heading" className="mt-20 border-t border-border pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="waitlist-heading" className="font-display text-2xl font-light">
            ABYSS waitlist
          </h2>
          {subscribers.length > 0 && (
            <a
              href="/api/admin/admin/waitlist.csv"
              className="font-mono text-xs tracking-[0.2em] text-fg uppercase no-underline hover:text-accent"
            >
              Export CSV ↓
            </a>
          )}
        </div>
        <p className="mt-2 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
          {subscribers.length} {subscribers.length === 1 ? 'person' : 'people'}
        </p>
        {subscribers.length > 0 && (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {subscribers.slice(0, 50).map((s) => (
              <li key={s._id} className="flex justify-between gap-4 py-3 font-mono text-xs">
                <span className="text-fg">{s.email}</span>
                <span className="text-fg-subtle">
                  {new Date(s.consentAt).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
