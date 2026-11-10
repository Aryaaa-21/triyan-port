import type { ReactNode } from 'react';
import { SCRIPT_BY_LANGUAGE, type LanguageKey } from '@triyan/shared';
import { cn } from '@/lib/cn';

export interface ProseProps {
  children: ReactNode;
  /** Selects the reading face. Hindi is set in Tiro Devanagari, not a Latin fallback. */
  language?: LanguageKey;
  /** Poetry gets a narrower measure and more open leading than prose. */
  variant?: 'poem' | 'prose';
  className?: string;
}

/**
 * The reading container. Nothing inside it animates (ARCHITECTURE §3.4) — the writing
 * is the one place on the site where the interface disappears entirely.
 */
export function Prose({
  children,
  language = 'ENGLISH',
  variant = 'prose',
  className,
}: ProseProps) {
  const devanagari = SCRIPT_BY_LANGUAGE[language] === 'devanagari';

  return (
    <div
      lang={devanagari ? 'hi' : 'en'}
      className={cn(
        devanagari ? 'font-reading-deva' : 'font-reading',
        variant === 'poem'
          ? 'measure-poem text-lg leading-poem whitespace-pre-line'
          : 'measure-prose text-lg leading-prose',
        'font-normal text-fg',
        '[&>p+p]:mt-6',
        '[&_em]:italic [&_strong]:font-medium',
        className,
      )}
    >
      {children}
    </div>
  );
}
