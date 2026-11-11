import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The site's one call to action: words and an arrow. No pill, no fill. The arrow
 * travels on hover and on keyboard focus alike.
 */
export function ArrowLink({
  href,
  children,
  external = false,
  className,
  tone = 'strong',
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
  tone?: 'strong' | 'quiet';
}) {
  const classes = cn(
    'group inline-flex items-center gap-3 py-2 font-mono text-xs tracking-[0.2em] uppercase no-underline transition-colors duration-500',
    tone === 'strong' ? 'text-fg hover:text-accent' : 'text-fg-subtle hover:text-fg',
    className,
  );
  const arrow = (
    <span
      aria-hidden="true"
      className="inline-block transition-transform duration-500 ease-void group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5"
    >
      {external ? '↗' : '→'}
    </span>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {arrow}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
      {arrow}
    </Link>
  );
}
