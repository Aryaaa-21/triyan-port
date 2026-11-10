'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Search input. Debounced so the archive is not queried on every keystroke, and
 * URL-synced so a search is shareable and survives a reload.
 */
export function ArchiveSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set('q', value.trim());
      else params.delete('q');
      params.delete('page');

      const qs = params.toString();
      router.replace(qs ? `/writings?${qs}` : '/writings', { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [value, router, searchParams]);

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="archive-search" className="sr-only">
        Search the archive
      </label>
      <input
        id="archive-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by word, title or theme"
        autoComplete="off"
        className="w-full max-w-prose border-0 border-b border-border bg-transparent py-3 font-reading text-lg text-fg placeholder:text-fg-subtle focus:border-focus focus:outline-none"
      />
    </form>
  );
}
