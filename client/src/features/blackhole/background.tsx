'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { decideTier, readEnv } from './capability';
import { createBlackHole } from './black-hole';

/**
 * The black hole as a living background.
 *
 * - Animated on capable devices: the disk turns, stars glitter and fall in, shooting
 *   stars come and go at random, the camera drifts and follows the pointer, and
 *   scrolling through the section draws you toward the hole.
 * - Under reduced motion: one still frame, drawn once.
 * - Without WebGL: a static image of the same scene (fetched only then).
 * - Paused whenever it is off screen or the tab is hidden.
 *
 * It sets --bh-progress (0 → 1) on its scroll scene — the nearest ancestor marked
 * data-scroll-scene, or its own parent — so text laid over it can move in CSS.
 */
export function BlackHoleBackground({
  radius = 0.22,
  minRadiusPx = 104,
  offset = [0, 0],
  scrollZoom = true,
  className,
}: {
  radius?: number;
  minRadiusPx?: number;
  offset?: [number, number];
  scrollZoom?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ox, oy] = offset;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const env = readEnv();
    // Very modest devices (or no WebGL) get the still image instead of the shader.
    const tier = decideTier({ ...env, reducedMotion: false });
    if (!env.webgl || tier === 'off') {
      host.dataset.webgl = 'none';
      return;
    }

    const hole = createBlackHole(canvas, {
      radius,
      minRadiusPx,
      offset: [ox, oy],
      dprCap: tier === 'high' ? 1.5 : 0.85,
      onFirstFrame: () => canvas.setAttribute('data-ready', 'true'),
    });
    if (!hole) {
      host.dataset.webgl = 'none';
      return;
    }

    if (env.reducedMotion) {
      hole.still(4.2);
      return () => hole.dispose();
    }

    let visible = true;
    const sync = () => (visible && !document.hidden ? hole.start() : hole.stop());
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      sync();
    });
    io.observe(host);
    document.addEventListener('visibilitychange', sync);

    const onPointer = (e: PointerEvent) =>
      hole.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    window.addEventListener('pointermove', onPointer, { passive: true });

    // Scroll progress belongs to the whole scroll scene when there is one (a tall
    // section with this canvas pinned inside it), otherwise to the host itself.
    const scene = host.closest<HTMLElement>('[data-scroll-scene]') ?? host;
    let scrollFrame = 0;
    const measure = () => {
      scrollFrame = 0;
      const rect = scene.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const raw = travel > 0 ? -rect.top / travel : -rect.top / Math.max(1, rect.height);
      const progress = Math.min(1, Math.max(0, raw));
      scene.style.setProperty('--bh-progress', progress.toFixed(4));
      // The fall: slow at first, then the shadow takes the whole screen.
      if (scrollZoom) hole.setZoom(1 + 9 * Math.pow(Math.min(progress / 0.78, 1), 2.2));
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollFrame);
      hole.dispose();
    };
  }, [radius, minRadiusPx, ox, oy, scrollZoom]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('black-hole pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
