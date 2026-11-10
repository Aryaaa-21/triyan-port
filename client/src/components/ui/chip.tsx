'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Reflected as `aria-pressed`, so the toggle state is announced, not just coloured. */
  active?: boolean;
  count?: number;
  children: ReactNode;
}

/**
 * The archive's filter control. Used for categories, themes, emotions and languages.
 */
export function Chip({ active = false, count, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5',
        'font-ui text-xs tracking-wide',
        'transition-colors duration-[var(--dur-base)] ease-void',
        active
          ? 'border-fg bg-fg text-bg'
          : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className={cn('text-2xs tabular-nums', active ? 'text-bg/70' : 'text-fg-subtle')}>
          {count}
        </span>
      )}
    </button>
  );
}
