import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * Display type that arrives letter by letter. Screen readers get the whole word
 * once; the letters are decorative. Pure CSS — no JavaScript, and under reduced
 * motion the word is simply there.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  step = 45,
}: {
  text: string;
  className?: string;
  /** ms before the first letter */
  delay?: number;
  /** ms between letters */
  step?: number;
}) {
  return (
    <span className={cn('split', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((char, i) => (
          <span
            // Index keys are correct here: the string is static.
            key={i}
            className="split-char"
            style={{ '--split-delay': `${delay + i * step}ms` } as CSSProperties}
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </span>
    </span>
  );
}
