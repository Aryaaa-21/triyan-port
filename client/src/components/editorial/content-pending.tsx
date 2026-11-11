import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * What the site shows where real content has not been supplied yet. It is honest
 * about the absence — "content to be added" — and designed, so a missing piece
 * reads as a reserved space rather than a broken page. It never invents a stand-in.
 */
export function ContentPending({
  label = 'Content to be added',
  children,
  className,
}: {
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-l border-border-strong py-2 pl-6', className)}>
      <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">{label}</p>
      {children && (
        <div className="mt-3 max-w-md font-reading text-base leading-prose text-fg-muted">
          {children}
        </div>
      )}
    </div>
  );
}
