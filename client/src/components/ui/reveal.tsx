import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface RevealProps {
  children: ReactNode;
  /** Stagger position within a group. Each step adds a small delay. */
  stagger?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
  /** rise: fade and lift (default) · clip: wipe upward, for images · blur: focus pull, for statements */
  variant?: 'rise' | 'clip' | 'blur';
}

/**
 * Section entrance: one fade-and-lift as the element arrives.
 *
 * Three constraints shaped this, and they rule out the obvious implementations:
 *
 *  1. The writing must never be invisible. So the element is visible by default, and
 *     only the pre-paint script's `js` class on <html> allows it to start hidden —
 *     meaning a reader without JavaScript sees everything immediately.
 *  2. No React state. Setting state from an effect triggers cascading renders, which
 *     the compiler rightly rejects, so the observer toggles a data attribute on the
 *     node directly.
 *  3. It must be correct at any viewport. A CSS `animation-timeline: view()` version
 *     left content stranded at partial opacity when most of the document was in view
 *     at once — visible as ghosting on a tall screen. An IntersectionObserver has no
 *     such failure mode.
 */
export function Reveal({
  children,
  stagger = 0,
  className,
  as = 'div',
  variant = 'rise',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      element.dataset.reveal = 'in';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.dataset.reveal = 'in';
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * Narrowed for typing only. A union of intrinsic tags makes TypeScript intersect
   * every element's ref type, which nothing can satisfy; the runtime value is still
   * whatever `as` was given.
   */
  const Tag = as as 'div';

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      data-reveal="out"
      data-variant={variant === 'rise' ? undefined : variant}
      style={stagger ? ({ '--reveal-step': String(stagger) } as CSSProperties) : undefined}
      className={cn('reveal', className)}
    >
      {children}
    </Tag>
  );
}
