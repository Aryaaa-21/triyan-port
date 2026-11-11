'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  CATEGORIES,
  getCategory,
  humanizeKey,
  THEME_KEYS,
  type CategoryKey,
  type InstagramMediaDto,
  type SyncStatusDto,
} from '@triyan/shared';
import { adminApi, AdminError } from '@/features/admin/client';

const useAction = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const run = (fn: () => Promise<string | void>) => {
    setError('');
    setMessage('');
    void fn()
      .then((msg) => {
        if (msg) setMessage(msg);
        startTransition(() => router.refresh());
      })
      .catch((cause: unknown) =>
        setError(cause instanceof AdminError ? cause.message : 'That action failed'),
      );
  };
  return { pending, message, error, run };
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-GB') : '—');

const button =
  'border border-border-strong px-4 py-2 font-ui text-2xs tracking-widest uppercase hover:border-fg disabled:opacity-50';

export function InstagramControls({ status }: { status: SyncStatusDto }) {
  const { pending, message, error, run } = useAction();

  return (
    <section aria-label="Sync" className="mt-8 border border-border p-6">
      <dl className="grid gap-x-8 gap-y-3 font-ui text-xs sm:grid-cols-3">
        <Row label="Provider">
          {status.provider}
          {status.provider === 'mock' && ' (development data)'}
          {!status.configured && ' — not configured'}
        </Row>
        <Row label="Health">{status.health}</Row>
        <Row label="Stored">{status.totalStored}</Row>
        <Row label="Last success">{when(status.lastSuccessAt)}</Row>
        <Row label="Last attempt">{when(status.lastAttemptAt)}</Row>
        <Row label="Rate limited until">{when(status.rateLimitedUntil)}</Row>
      </dl>
      {status.lastError && (
        <p className="mt-4 font-ui text-xs text-ember">Last error: {status.lastError}</p>
      )}
      {status.lastRun && (
        <p className="mt-2 font-ui text-xs text-fg-subtle">
          Last run ({status.lastRun.mode}): {status.lastRun.fetched} fetched,{' '}
          {status.lastRun.created} new, {status.lastRun.updated} updated,{' '}
          {status.lastRun.markedUnavailable} gone, {status.lastRun.pages} pages
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() =>
            run(async () => {
              const r = (await adminApi.syncInstagram('INCREMENTAL')).data;
              return `Sync ${r?.status.toLowerCase()}: ${r?.created ?? 0} new, ${r?.updated ?? 0} updated`;
            })
          }
        >
          Sync now
        </button>
        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() =>
            run(async () => {
              const r = (await adminApi.syncInstagram('FULL')).data;
              return `Full sync ${r?.status.toLowerCase()}: ${r?.fetched ?? 0} fetched`;
            })
          }
        >
          Full sync
        </button>
        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() =>
            run(async () => {
              if (
                !window.confirm(
                  'Reclassify every post that needs review? Manual corrections are kept.',
                )
              )
                return;
              const r = (await adminApi.reclassifyInstagram('NEEDS_REVIEW')).data;
              return `${r?.reclassified ?? 0} reclassified`;
            })
          }
        >
          Reclassify review queue
        </button>
      </div>
      <p aria-live="polite" className="mt-4 font-ui text-xs text-fg-muted">
        {message}
      </p>
      {error && (
        <p role="alert" className="font-ui text-xs text-ember">
          {error}
        </p>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="tracking-widest text-fg-subtle uppercase">{label}</dt>
      <dd className="mt-1 text-fg">{children}</dd>
    </div>
  );
}

export function InstagramRows({ posts }: { posts: InstagramMediaDto[] }) {
  return (
    <ul className="mt-8 divide-y divide-border border-y border-border">
      {posts.map((post) => (
        <InstagramRow key={post._id} post={post} />
      ))}
    </ul>
  );
}

function InstagramRow({ post }: { post: InstagramMediaDto }) {
  const { pending, error, run } = useAction();
  const c = post.classification;
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<CategoryKey>(c.primaryCategory ?? 'HUMAN_CONDITION');
  const [themes, setThemes] = useState<string[]>(c.themes);

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-reading text-base text-fg">
            {post.caption.split('\n')[0] || '(no caption)'}
          </p>
          <p className="mt-1 font-ui text-2xs tracking-widest text-fg-subtle uppercase">
            {new Date(post.timestamp).toLocaleDateString('en-GB')} · {post.productType} ·{' '}
            {c.primaryCategory ? getCategory(c.primaryCategory)?.label : 'Uncategorised'} ·{' '}
            {c.language} · {Math.round(c.confidence * 100)}% {c.method}
            {c.needsReview && <span className="text-ember"> · needs review</span>}
            {post.featured && ' · featured'}
            {post.hidden && ' · hidden'}
            {!post.available && ' · gone upstream'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() =>
              run(
                async () =>
                  void (await adminApi.updateInstagram(post._id, { featured: !post.featured })),
              )
            }
          >
            {post.featured ? 'Unfeature' : 'Feature'}
          </button>
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() =>
              run(
                async () =>
                  void (await adminApi.updateInstagram(post._id, { hidden: !post.hidden })),
              )
            }
          >
            {post.hidden ? 'Show' : 'Hide'}
          </button>
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() => run(async () => void (await adminApi.refreshInstagram(post._id)))}
          >
            Refresh
          </button>
          <button
            type="button"
            className={button}
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
          >
            Correct
          </button>
        </div>
      </div>

      {editing && (
        <form
          className="mt-4 grid gap-4 border border-border p-4 sm:grid-cols-[14rem_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await adminApi.correctInstagram(post._id, {
                primaryCategory: category,
                themes,
                emotions: c.emotions,
              });
              setEditing(false);
              return 'Saved';
            });
          }}
        >
          <label className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className="mt-2 block w-full border border-border bg-bg p-2 font-ui text-sm text-fg normal-case"
            >
              {CATEGORIES.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">
              Themes
            </legend>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {THEME_KEYS.map((t) => (
                <label key={t} className="font-ui text-xs text-fg-muted">
                  <input
                    type="checkbox"
                    checked={themes.includes(t)}
                    onChange={(e) =>
                      setThemes((cur) =>
                        e.target.checked ? [...cur, t].slice(0, 8) : cur.filter((x) => x !== t),
                      )
                    }
                  />{' '}
                  {humanizeKey(t)}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className={`${button} self-end`} disabled={pending}>
            Save
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 font-ui text-xs text-ember">
          {error}
        </p>
      )}
    </li>
  );
}
