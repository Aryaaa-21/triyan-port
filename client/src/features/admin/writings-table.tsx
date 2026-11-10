'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { WritingDto } from '@triyan/shared';
import { adminApi, AdminError } from '@/features/admin/client';

/** The interactive part of the dashboard. The data itself is rendered on the server. */
export function WritingsTable({ writings }: { writings: WritingDto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const act = (fn: () => Promise<unknown>) => {
    setError('');
    void fn()
      .then(() => startTransition(() => router.refresh()))
      .catch((cause: unknown) => {
        setError(cause instanceof AdminError ? cause.message : 'That action failed');
      });
  };

  return (
    <>
      {error && (
        <p role="alert" className="mt-6 font-ui text-xs text-ember">
          {error}
        </p>
      )}

      <table className="mt-10 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {['Title', 'Status', 'Slug', 'Actions'].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="py-3 font-ui text-2xs tracking-widest text-fg-subtle uppercase"
              >
                {heading === 'Actions' ? <span className="sr-only">Actions</span> : heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-busy={pending}>
          {writings.map((writing) => (
            <tr key={writing._id} className="border-b border-border/60">
              <td className="py-4 pr-4">
                <Link
                  href={`/admin/writings/${writing._id}`}
                  className="font-reading text-base text-fg no-underline hover:text-accent"
                >
                  {writing.title}
                </Link>
                {writing.featured && (
                  <span className="ml-2 font-ui text-2xs tracking-widest text-accent uppercase">
                    Featured
                  </span>
                )}
              </td>
              <td className="py-4 pr-4 font-ui text-xs">
                <span className={writing.status === 'PUBLISHED' ? 'text-fg' : 'text-fg-subtle'}>
                  {writing.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="py-4 pr-4 font-ui text-xs text-fg-subtle">{writing.slug}</td>
              <td className="py-4 text-right whitespace-nowrap">
                {writing.status === 'PUBLISHED' ? (
                  <>
                    <Link
                      href={`/writings/${writing.slug}`}
                      className="mr-4 font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => act(() => adminApi.unpublish(writing._id))}
                      className="font-ui text-2xs tracking-widest text-fg-subtle uppercase hover:text-fg disabled:opacity-40"
                    >
                      Unpublish
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(() => adminApi.publish(writing._id))}
                    className="font-ui text-2xs tracking-widest text-fg uppercase hover:text-accent disabled:opacity-40"
                  >
                    Publish
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
