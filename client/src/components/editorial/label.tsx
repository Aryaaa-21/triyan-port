import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** The technical register: mono, uppercase, tracked. Dates, categories, numbering. */
export function Label({
  children,
  className,
  as: Tag = 'span',
}: {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'dt' | 'dd' | 'li';
}) {
  return (
    <Tag className={cn('font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase', className)}>
      {children}
    </Tag>
  );
}
