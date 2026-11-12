import { useEffect, useRef, type RefObject } from 'react';

/**
 * Wind streams that trail the pointer — in grey.
 *
 * Adapted for this site from a colour version:
 * - Monochrome. Streams are painted with the theme's own greys (--wind-strong,
 *   --wind-soft, --wind-faint), so they are light on black at night and ink on paper
 *   by day. No colour is hard-coded here.
 * - The system cursor is never hidden; this is atmosphere around it, not a
 *   replacement for it.
 * - Off under reduced motion and on touch or coarse pointers.
 * - Idle costs nothing: the animation loop stops when no stream is alive.
 * - Hit-testing for interactive elements happens on movement, not every frame.
 *
 * It fills its container (which must be positioned). Pass `containerRef`, or place
 * it directly inside the element it should cover.
 *
 * With `fixed` it covers the whole window instead and follows the pointer across every
 * page. One canvas then sits over black sections and paper ones alike, so it is drawn
 * in white and blended by difference: light on dark, ink on light, with no theme lookup.
 */

/** White and two greys from the tokens: under `mix-blend-mode: difference` they invert the page beneath. */
const FIXED_TOKENS = ['--wind-over-strong', '--wind-over-soft', '--wind-over-faint'];

export interface WindStreamConfig {
  /** Streams spawned per qualifying mouse move. */
  count?: number;
  /** Velocity kept per frame (0–1). Lower settles faster. */
  decay?: number;
  /** Minimum movement in px per event before streams appear. */
  minSpeed?: number;
  /** Over links and buttons: twice the streams, thicker strokes, and a gentle idle flow. */
  pointerAnim?: boolean;
  pointerThickness?: number;
  /** A burst of streams on click. */
  clickAnim?: boolean;
}

export interface WindStreamCursorProps {
  containerRef?: RefObject<HTMLElement | null>;
  config?: WindStreamConfig;
  className?: string;
  /** Cover the window rather than a container: the site-wide cursor. */
  fixed?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Stream {
  points: Point[];
  vx: number;
  vy: number;
  alpha: number;
  /** Index into the grey palette: 0 strong, 1 soft, 2 faint. */
  tone: number;
}

const INTERACTIVE = new Set(['BUTTON', 'INPUT', 'A', 'LABEL', 'SELECT', 'TEXTAREA']);

const overInteractive = (x: number, y: number) =>
  document
    .elementsFromPoint(x, y)
    .some((el) => INTERACTIVE.has(el.tagName) || el.getAttribute('role') === 'button');

export default function WindStreamCursor({
  containerRef,
  config,
  className,
  fixed = false,
}: WindStreamCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef<WindStreamConfig | undefined>(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = fixed
      ? document.documentElement
      : (containerRef?.current ?? canvas?.parentElement ?? null);
    if (!canvas || !container) return;
    /** Where pointer events are heard: the whole window, or just the container. */
    const surface: Window | HTMLElement = fixed ? window : container;
    const origin = () => (fixed ? { left: 0, top: 0 } : container.getBoundingClientRect());

    const canAnimate =
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canAnimate) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let streams: Stream[] = [];
    let mx = 0;
    let my = 0;
    let raf = 0;
    let running = false;
    let frame = 0;
    let inside = false;
    let pointer = false;
    let palette: string[] = [];

    /** The greys come from CSS, resolved for this container, so themes apply. */
    const readPalette = () => {
      const styles = getComputedStyle(container);
      palette = (fixed ? FIXED_TOKENS : ['--wind-strong', '--wind-soft', '--wind-faint']).map(
        (name) => styles.getPropertyValue(name).trim() || styles.color,
      );
    };
    readPalette();
    const themeObserver = new MutationObserver(readPalette);
    themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', readPalette);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round((fixed ? window.innerWidth : container.offsetWidth) * dpr);
      canvas.height = Math.round((fixed ? window.innerHeight : container.offsetHeight) * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    if (fixed) window.addEventListener('resize', resize);

    const spawn = (x: number, y: number, vx: number, vy: number, alpha: number, tone?: number) => {
      streams.push({
        points: [{ x, y }],
        vx,
        vy,
        alpha,
        tone: tone ?? Math.floor(Math.random() * 2),
      });
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      const { count = 2, minSpeed = 2.5, pointerAnim = true } = configRef.current ?? {};
      const r = origin();
      const nx = e.clientX - r.left;
      const ny = e.clientY - r.top;
      const dx = nx - mx;
      const dy = ny - my;
      mx = nx;
      my = ny;
      inside = true;
      pointer = pointerAnim && overInteractive(e.clientX, e.clientY);

      if (Math.hypot(dx, dy) > minSpeed) {
        const n = pointer ? count * 2 : count;
        for (let i = 0; i < n; i += 1) {
          spawn(
            mx,
            my,
            dx * 0.28 + (Math.random() - 0.5) * 3.5,
            dy * 0.28 + (Math.random() - 0.5) * 3.5,
            0.82,
          );
        }
      }
      start();
    };

    const onClick = (e: MouseEvent) => {
      if (configRef.current?.clickAnim === false) return;
      const r = origin();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      // The burst mixes all three greys, where the colour version mixed hues.
      for (let i = 0; i < 18; i += 1) {
        const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const speed = Math.random() * 5 + 3;
        spawn(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.95, i % 3);
      }
      start();
    };

    const onLeave = () => {
      inside = false;
      pointer = false;
    };

    const move = onMove as EventListener;
    const click = onClick as EventListener;
    surface.addEventListener('mousemove', move);
    surface.addEventListener('click', click);
    container.addEventListener('mouseleave', onLeave);

    function loop() {
      const {
        decay = 0.93,
        count = 2,
        pointerAnim = true,
        pointerThickness = 6.5,
      } = configRef.current ?? {};
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame += 1;

      const hovering = pointerAnim && pointer && inside;

      // Resting over a link or button: a gentle, constant updraft.
      if (hovering && frame % 4 === 0) {
        for (let i = 0; i < count; i += 1) {
          spawn(mx, my, (Math.random() - 0.5) * 3.8, (Math.random() - 0.5) * 3.8 - 1.2, 0.82);
        }
      }

      streams = streams.filter((s) => s.alpha > 0.02);
      const thickness = hovering ? pointerThickness : 3.5;
      const glow = hovering ? 12 : 5;

      for (const s of streams) {
        s.vx *= decay;
        s.vy *= decay;
        s.vy += 0.045;
        const last = s.points[s.points.length - 1];
        if (!last) continue;
        s.points.push({ x: last.x + s.vx, y: last.y + s.vy });
        if (s.points.length > 22) s.points.shift();
        s.alpha *= 0.952;
        if (s.points.length < 3) continue;

        const first = s.points[0];
        if (!first) continue;
        const colour = palette[s.tone] ?? palette[0] ?? '';

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < s.points.length - 1; i += 1) {
          const p = s.points[i];
          const q = s.points[i + 1];
          if (!p || !q) continue;
          ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
        }
        // Alpha via globalAlpha, so the colour stays a theme value.
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = colour;
        ctx.lineWidth = Math.max(0.5, s.alpha * thickness);
        ctx.lineCap = 'round';
        ctx.shadowColor = colour;
        ctx.shadowBlur = glow;
        ctx.stroke();
        ctx.restore();
      }

      // Nothing left to draw and nothing keeping the flow alive: stop until the next move.
      if (streams.length === 0 && !hovering) {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    return () => {
      surface.removeEventListener('mousemove', move);
      surface.removeEventListener('click', click);
      container.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
      scheme.removeEventListener('change', readPalette);
      themeObserver.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef, fixed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: fixed ? 'fixed' : 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: fixed ? 45 : 35,
        ...(fixed ? { mixBlendMode: 'difference' as const } : {}),
      }}
    />
  );
}

export { WindStreamCursor };
