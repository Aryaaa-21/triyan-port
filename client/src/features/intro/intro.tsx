'use client';

import { useEffect, useRef, useState } from 'react';
import { createBlackHole } from './black-hole';

/**
 * The loading screen: a black hole, turning, while the site arrives — then the
 * camera falls into it and the site appears out of the dark.
 *
 * Whether it plays is decided before first paint by `introInitScript` (homepage,
 * first visit of the session, motion allowed, WebGL present), which sets
 * html[data-intro="play"]; CSS shows this overlay only then. Without JavaScript, or
 * on any other page, it never appears. Skip (or Escape) ends it at once.
 */

const MIN_MS = 2800; // long enough to see it; never long enough to wait for it
const MAX_MS = 6000;
const FALL_MS = 1500;
const SEEN_KEY = 'triyan.intro';

type Phase = 'loading' | 'falling' | 'done';

export function Intro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== 'play') return;

    const site = document.getElementById('site');
    site?.setAttribute('inert', '');
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // No auto-focus (it would draw a ring for everyone). The page behind is inert, so
    // Skip is the only stop: a keyboard user's first Tab lands on it, and Escape works too.

    const finish = () => {
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Private mode: it may play again next visit. Harmless.
      }
      delete html.dataset.intro;
      site?.removeAttribute('inert');
      document.body.style.overflow = overflow;
      setPhase('done');
    };

    const canvas = canvasRef.current;
    const hole = canvas
      ? createBlackHole(canvas, () => rootRef.current?.setAttribute('data-ready', 'true'))
      : null;
    if (!hole) {
      finish();
      return;
    }

    let fallFrame = 0;
    let ended = false;
    const fall = () => {
      if (ended) return;
      ended = true;
      setPhase('falling');
      rootRef.current?.setAttribute('data-phase', 'falling');
      const begin = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - begin) / FALL_MS);
        // Ease in: a slow lean forward, then the drop.
        hole.setZoom(1 + Math.pow(k, 3) * 16);
        if (k < 1) fallFrame = requestAnimationFrame(step);
        else finish();
      };
      fallFrame = requestAnimationFrame(step);
    };

    // Ready when the page has loaded and the minimum has passed; never past the maximum.
    const started = performance.now();
    let readyTimer = 0;
    const whenLoaded = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      readyTimer = window.setTimeout(fall, wait);
    };
    if (document.readyState === 'complete') whenLoaded();
    else window.addEventListener('load', whenLoaded, { once: true });
    const maxTimer = window.setTimeout(fall, MAX_MS);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') fall();
    };
    document.addEventListener('keydown', onKey);
    skipRef.current?.addEventListener('click', fall);
    const skip = skipRef.current;

    return () => {
      window.removeEventListener('load', whenLoaded);
      document.removeEventListener('keydown', onKey);
      skip?.removeEventListener('click', fall);
      window.clearTimeout(readyTimer);
      window.clearTimeout(maxTimer);
      cancelAnimationFrame(fallFrame);
      hole.dispose();
      site?.removeAttribute('inert');
      document.body.style.overflow = overflow;
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      ref={rootRef}
      className="intro"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="intro-canvas absolute inset-0 h-full w-full"
      />
      <div className="intro-chrome pointer-events-none absolute inset-x-0 bottom-[12vh] flex flex-col items-center gap-5">
        <p className="font-mono text-2xs tracking-[0.5em] text-white/55 uppercase" role="status">
          Entering the abyss
        </p>
        <span aria-hidden="true" className="intro-progress block h-px w-40 bg-white/15">
          <span className="block h-full bg-white/70" />
        </span>
      </div>
      <button
        ref={skipRef}
        type="button"
        className="intro-chrome absolute top-5 right-[var(--space-gutter)] py-2 font-mono text-2xs tracking-[0.3em] text-white/55 uppercase hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}

/**
 * Runs in <head> before first paint. Decides whether the intro plays, so the
 * homepage never flashes before the overlay covers it — and so nothing is ever
 * covered for readers who arrive anywhere else, once per session.
 */
export const introInitScript = `(function(){try{
if(location.pathname!=='/')return;
if(sessionStorage.getItem('${SEEN_KEY}'))return;
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var c=document.createElement('canvas');
if(!(c.getContext('webgl')))return;
document.documentElement.dataset.intro='play';
}catch(e){}})();`;
