import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Moves its content slightly with the scroll — against it (y), or sideways (x).
 * Under reduced motion it stays still. Decorative by default; pass
 * decorative={false} when it wraps real content.
 */
export function Parallax({
  children,
  speed = 0.15,
  axis = 'y',
  decorative = true,
  className,
}: {
  children: ReactNode;
  speed?: number;
  /** y: against the scroll; x: a sideways drift as the page scrolls. */
  axis?: 'x' | 'y';
  /** Decorative layers are hidden from assistive technology; real content is not. */
  decorative?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform =
        axis === 'x'
          ? `translate3d(${(-offset).toFixed(1)}px, 0, 0)`
          : `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [speed, axis]);

  return (
    <div
      ref={ref}
      aria-hidden={decorative ? true : undefined}
      className={cn('will-change-transform', className)}
    >
      {children}
    </div>
  );
}
