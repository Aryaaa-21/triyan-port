'use client';

import { useEffect, useRef } from 'react';
import { decideTier, readEnv } from './capability';

/**
 * Mounts the WebGL cosmos behind the opening — lazily, after the page is
 * interactive, and only when the device can afford it. Three.js is a separate
 * chunk that a reader on a phone with reduced motion never downloads.
 */
export function CosmicField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tier = decideTier(readEnv());
    if (tier === 'off') return;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const [{ createCosmos }, { Color }] = await Promise.all([import('./scene'), import('three')]);
      if (disposed) return;
      const cosmos = createCosmos(canvas, tier, () => {
        canvas.dataset.ready = 'true';
      });

      const readTheme = () => {
        const styles = getComputedStyle(document.documentElement);
        const color = styles.getPropertyValue('--fg').trim();
        if (!color) return;
        // Dark ink means a light page, whether chosen explicitly or by the system.
        const probe = new Color(color);
        const light = probe.r * 0.299 + probe.g * 0.587 + probe.b * 0.114 < 0.5;
        cosmos.setTheme(color, light);
      };
      readTheme();
      const themeObserver = new MutationObserver(readTheme);
      themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'] });

      const section = canvas.parentElement;
      const onScroll = () => {
        const h = section?.offsetHeight ?? window.innerHeight;
        cosmos.setProgress(window.scrollY / Math.max(1, h));
      };
      const onPointer = (e: PointerEvent) => {
        cosmos.setPointer(
          e.clientX / window.innerWidth - 0.5,
          e.clientY / window.innerHeight - 0.5,
        );
      };
      // Nothing renders while the opening is off screen or the tab is hidden.
      const visibility = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting && !document.hidden) cosmos.resume();
        else cosmos.pause();
      });
      if (section) visibility.observe(section);
      const onHidden = () => (document.hidden ? cosmos.pause() : cosmos.resume());

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('visibilitychange', onHidden);

      cleanup = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointer);
        document.removeEventListener('visibilitychange', onHidden);
        visibility.disconnect();
        themeObserver.disconnect();
        cosmos.dispose();
      };
    };

    // Reading comes first: wait until the browser is idle before paying for WebGL —
    // and until the black-hole intro, if it is playing, has finished with the GPU.
    const run = () => {
      const html = document.documentElement;
      if (html.dataset.intro !== 'play') {
        void start().catch(() => undefined);
        return;
      }
      const wait = new MutationObserver(() => {
        if (html.dataset.intro === 'play') return;
        wait.disconnect();
        void start().catch(() => undefined);
      });
      wait.observe(html, { attributeFilter: ['data-intro'] });
      cleanup = () => wait.disconnect();
    };
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle
      ? window.requestIdleCallback(run, { timeout: 1500 })
      : globalThis.setTimeout(run, 300);

    return () => {
      disposed = true;
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else globalThis.clearTimeout(idle);
      cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="cosmos pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
