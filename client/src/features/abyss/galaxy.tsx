import { useEffect, useRef } from 'react';

/**
 * The galaxy behind the ABYSS mark. As the reader scrolls through the opening, the
 * camera falls toward its bright core, the way the black hole used to draw you in.
 * Under reduced motion it stays still.
 */
export function GalaxyBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const scene = host?.parentElement;
    if (!host || !scene) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = scene.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      // Slow at first, then the core takes the screen.
      const zoom = 1 + 3.2 * Math.pow(progress, 1.5);
      host.style.setProperty('--galaxy-zoom', zoom.toFixed(4));
      host.style.setProperty('--galaxy-progress', progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="galaxy pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <img
        src="/images/abyss-galaxy.webp"
        alt=""
        width={860}
        height={710}
        decoding="async"
        fetchPriority="high"
        className="galaxy-image h-full w-full object-cover select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black" />
    </div>
  );
}
