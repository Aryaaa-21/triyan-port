import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface RevealProps {
  children: ReactNode;
  /**
   * Stagger position within a group, in steps. Each step delays the entrance by a
   * slice of the element's scroll range — not by a timer, so it stays in step with
   * the reader's own scrolling.
   */
  stagger?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Section entrance: a single fade-and-lift as the element scrolls into view.
 *
 * Implemented with a scroll-driven CSS animation rather than an IntersectionObserver.
 * That choice matters here: it ships no JavaScript, cannot desynchronise from the
 * server-rendered markup, and degrades to plain visible content on browsers without
 * `animation-timeline` support — so the writing is never hidden behind a script
 * (ARCHITECTURE §3.4, §12).
 */
export function Reveal({ children, stagger = 0, className, as = 'div' }: RevealProps) {
  const Tag = as;
  const style = stagger ? ({ '--reveal-step': String(stagger) } as CSSProperties) : undefined;

  return (
    <Tag className={cn('reveal', className)} style={style}>
      {children}
    </Tag>
  );
}
