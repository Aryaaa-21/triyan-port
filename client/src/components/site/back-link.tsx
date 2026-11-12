import type { MouseEvent, ReactNode } from 'react';
import Link from '@/lib/link';
import { useRouter } from '@/lib/navigation';
import { cn } from '@/lib/cn';

/**
 * The way back out of a single piece. If the reader came from a page of this site, it
 * returns them to exactly where they were — same page of the list, same shelf, same
 * scroll position. Opened directly (a shared link), it goes to `href` instead.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Leave new-tab and modified clicks to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    // React Router numbers each entry of this visit; above zero means there is a page behind.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-3 py-2 font-mono text-xs tracking-[0.2em] text-fg-muted uppercase no-underline transition-colors duration-500 hover:text-fg',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-500 ease-void group-hover:-translate-x-1.5"
      >
        ←
      </span>
      {children}
    </Link>
  );
}
