import { useRouter, useSearchParams } from '@/lib/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

/**
 * Search. Debounced so the archive is not queried on every keystroke, and URL-synced
 * so a search is shareable and survives a reload. The other filters are preserved.
 */
export function ArchiveSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  // The address is read through a ref, so that a change of page or shelf (which changes
  // the address but not the search) never re-runs the search and resets the paging.
  const paramsRef = useRef(searchParams);
  useEffect(() => {
    paramsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    const wanted = value.trim();
    // Nothing to do when the address already says what the box says.
    if (wanted === (paramsRef.current.get('q') ?? '')) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(paramsRef.current.toString());
      if (wanted) params.set('q', wanted);
      else params.delete('q');
      params.delete('page');
      const qs = params.toString();
      startTransition(() =>
        router.replace(qs ? `/writings?${qs}` : '/writings', { scroll: false }),
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [value, router]);

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
      <label
        htmlFor="archive-search"
        className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
      >
        Search
      </label>
      <input
        id="archive-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="a word, a title, a feeling"
        autoComplete="off"
        className="mt-2 w-full border-0 border-b border-border-strong bg-transparent py-3 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-light text-fg placeholder:text-fg-subtle/70 focus:border-fg focus:outline-none"
      />
      <span
        aria-live="polite"
        className="absolute right-0 bottom-4 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase"
      >
        {pending ? 'Searching…' : ''}
      </span>
    </form>
  );
}
