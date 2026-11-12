import { useEffect, useRef } from 'react';

/**
 * A hairline under the top edge that fills as the page is read. Written straight to
 * the element's transform on scroll, so reading never causes a re-render.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      const root = document.documentElement;
      const room = root.scrollHeight - window.innerHeight;
      const done = room > 0 ? Math.min(1, Math.max(0, window.scrollY / room)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${done})`;
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-(--z-overlay) h-0.5"
    >
      <div ref={bar} className="h-full origin-left scale-x-0 bg-fg" />
    </div>
  );
}
