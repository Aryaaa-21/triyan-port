import type { MouseEvent, ReactNode } from 'react';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * "Scroll to enter": a link to the next section that, instead of jumping, glides the
 * page down — through the opening, so its fall plays on the way. It stops the moment
 * the visitor scrolls, touches or presses a key themselves. Under reduced motion it is
 * an ordinary jump. Focus moves to the section on arrival, for keyboard users.
 */
export function ScrollCue({
  target,
  className,
  children,
}: {
  target: string;
  className?: string;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(target);
    if (!el) return;
    event.preventDefault();

    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const to = Math.max(0, el.getBoundingClientRect().top + window.scrollY - margin);
    const arrive = () => el.focus({ preventScroll: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: to, behavior: 'instant' });
      arrive();
      return;
    }

    const from = window.scrollY;
    const distance = to - from;
    const duration = Math.min(3200, Math.max(1200, Math.abs(distance) * 0.9));
    const start = performance.now();
    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) =>
        window.removeEventListener(type, stop),
      );
    };
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo({ top: from + distance * ease(t), behavior: 'instant' });
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        stop();
        arrive();
      }
    };
    // The visitor taking over ends the glide; it never fights them.
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) =>
      window.addEventListener(type, stop, { passive: true }),
    );
    frame = requestAnimationFrame(step);
  };

  return (
    <a href={`#${target}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
