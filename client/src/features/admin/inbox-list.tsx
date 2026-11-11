import { useRouter } from '@/lib/navigation';
import { useState, useTransition } from 'react';
import type { ContactMessageDto } from '@triyan/shared';
import { adminApi, AdminError } from '@/features/admin/client';
import { cn } from '@/lib/cn';

const button =
  'font-mono text-2xs tracking-[0.18em] uppercase text-fg-subtle hover:text-fg disabled:opacity-40';

export function InboxList({ messages }: { messages: ContactMessageDto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const act = (fn: () => Promise<unknown>) => {
    setError('');
    void fn()
      .then(() => startTransition(() => router.refresh()))
      .catch((cause: unknown) =>
        setError(cause instanceof AdminError ? cause.message : 'That action failed'),
      );
  };

  return (
    <>
      {error && (
        <p role="alert" className="mt-6 font-mono text-xs text-ember">
          {error}
        </p>
      )}
      <ul aria-busy={pending} className="mt-8 divide-y divide-border border-y border-border">
        {messages.map((m) => (
          <li key={m._id} className={cn('py-6', m.read && 'opacity-60')}>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <p className="font-display text-xl font-light text-fg">
                {!m.read && (
                  <span
                    className="mr-2 inline-block size-2 rounded-full bg-fg align-middle"
                    aria-label="Unread"
                  />
                )}
                {m.name}{' '}
                <a href={`mailto:${m.email}`} className="font-mono text-xs text-fg-subtle">
                  {m.email}
                </a>
              </p>
              <time dateTime={m.createdAt} className="font-mono text-2xs text-fg-subtle">
                {new Date(m.createdAt).toLocaleString('en-GB')}
              </time>
            </div>
            <p className="mt-4 max-w-prose font-reading text-base leading-prose whitespace-pre-wrap text-fg-muted">
              {m.message}
            </p>
            <div className="mt-4 flex gap-6">
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`}
                className={cn(button, 'no-underline')}
              >
                Reply
              </a>
              <button
                type="button"
                className={button}
                disabled={pending}
                onClick={() => act(() => adminApi.markMessage(m._id, !m.read))}
              >
                Mark {m.read ? 'unread' : 'read'}
              </button>
              <button
                type="button"
                className={button}
                disabled={pending}
                onClick={() => {
                  if (window.confirm('Delete this message? This cannot be undone.'))
                    act(() => adminApi.deleteMessage(m._id));
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
