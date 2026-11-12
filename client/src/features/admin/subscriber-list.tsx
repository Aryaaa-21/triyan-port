import { useRouter } from '@/lib/navigation';
import { useState, useTransition } from 'react';
import type { SubscriberDto } from '@triyan/shared';
import { adminApi, AdminError } from '@/features/admin/client';
import { useConfirm } from '@/components/ui/confirm';

const STATUS_LABEL: Record<SubscriberDto['status'], string> = {
  ACTIVE: 'Confirmed',
  PENDING: 'Awaiting confirmation',
  UNSUBSCRIBED: 'Unsubscribed',
};

export function SubscriberList({ subscribers }: { subscribers: SubscriberDto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [confirm, confirmDialog] = useConfirm();

  const remove = async (subscriber: SubscriberDto) => {
    const yes = await confirm({
      title: `Remove ${subscriber.email}?`,
      body: 'The address is deleted from the list. This cannot be undone.',
      confirmLabel: 'Remove',
    });
    if (!yes) return;
    setError('');
    try {
      await adminApi.deleteSubscriber(subscriber._id);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof AdminError ? cause.message : 'That address could not be removed');
    }
  };

  return (
    <>
      {confirmDialog}
      {error && (
        <p role="alert" className="mt-6 font-mono text-xs text-ember">
          {error}
        </p>
      )}
      <ul aria-busy={pending} className="mt-8 divide-y divide-border border-y border-border">
        {subscribers.map((s) => (
          <li
            key={s._id}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
          >
            <span className="font-mono text-sm break-all text-fg">{s.email}</span>
            <span className="flex items-baseline gap-6 font-mono text-2xs tracking-[0.12em] text-fg-subtle uppercase">
              <span className={s.status === 'ACTIVE' ? 'text-fg-muted' : undefined}>
                {STATUS_LABEL[s.status]}
              </span>
              <time dateTime={s.createdAt}>
                {new Date(s.createdAt).toLocaleDateString('en-GB')}
              </time>
              <button
                type="button"
                disabled={pending}
                onClick={() => void remove(s)}
                className="tracking-[0.18em] uppercase hover:text-fg disabled:opacity-40"
              >
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
