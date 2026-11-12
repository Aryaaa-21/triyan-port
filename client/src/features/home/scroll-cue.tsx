import type { MouseEvent, ReactNode } from 'react';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * "Scroll to enter": a link to the next section that, instead of jumping, glides the
 * page down — through the opening, so its fall plays on the way. It stops the moment
 * the visitor scrolls, touches or presses a key themselves. Under reduced motion it is
 * an ordinary jump. Focus moves to the section on arrival, for keyboard users.
 *
 * `rest` makes the glide stop on the way and wait: `at` is how far through the cue's own
 * scroll scene (0 → 1) to stop, `ms` how long. The opening uses it to hold on the line
 * in the dark long enough to be read, where an unbroken glide would sweep past it.
 */
export function ScrollCue({
  target,
  className,
  children,
  rest,
}: {
  target: string;
  className?: string;
  children: ReactNode;
  rest?: { at: number; ms: number };
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

    // Where to pause, in page pixels: a point inside the scroll scene this cue sits in.
    let pauseAt: number | null = null;
    const scene = event.currentTarget.closest<HTMLElement>('[data-scroll-scene]');
    if (rest && scene) {
      const rect = scene.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const y = rect.top + window.scrollY + travel * rest.at;
      if (travel > 0 && y > from + 1 && y < to - 1) pauseAt = y;
    }

    let frame = 0;
    let timer = 0;
    const takeover = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const stop = () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      takeover.forEach((type) => window.removeEventListener(type, stop));
    };

    /** One eased leg of the glide, then `done`. */
    const glide = (a: number, b: number, done: () => void) => {
      const distance = b - a;
      const duration = Math.min(3200, Math.max(1200, Math.abs(distance) * 0.9));
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo({ top: a + distance * ease(t), behavior: 'instant' });
        if (t < 1) frame = requestAnimationFrame(step);
        else done();
      };
      frame = requestAnimationFrame(step);
    };

    const finish = () => {
      stop();
      arrive();
    };

    // The visitor taking over ends the glide, or the wait; it never fights them.
    takeover.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    if (pauseAt === null || !rest) {
      glide(from, to, finish);
    } else {
      const stopAt = pauseAt;
      glide(from, stopAt, () => {
        timer = window.setTimeout(() => glide(stopAt, to, finish), rest.ms);
      });
    }
  };

  return (
    <a href={`#${target}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
