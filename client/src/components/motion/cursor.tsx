import { useEffect, useRef } from 'react';

/**
 * A companion cursor for fine pointers: a soft ring that trails the system cursor
 * and responds to what it is over. The system cursor is never hidden, so nothing
 * depends on this — on touch, under reduced motion or forced colours it never
 * mounts at all.
 *
 * States come from the nearest `data-cursor` attribute, or from the element type:
 *   link · writing · view (images) · nav · interactive · magnetic
 */
type State = 'default' | 'link' | 'writing' | 'view' | 'nav' | 'interactive' | 'magnetic';

const stateFor = (target: Element | null): { state: State; el: Element | null } => {
  const explicit = target?.closest('[data-cursor]');
  if (explicit) return { state: explicit.getAttribute('data-cursor') as State, el: explicit };
  const nav = target?.closest('header a, header button');
  if (nav) return { state: 'nav', el: nav };
  const image = target?.closest('a img, a picture');
  if (image) return { state: 'view', el: image };
  const link = target?.closest('a');
  if (link) return { state: 'link', el: link };
  const control = target?.closest('button, input, textarea, select, label, summary');
  if (control) return { state: 'interactive', el: control };
  return { state: 'default', el: null };
};

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ref.current;
    if (!ring) return;
    const ok =
      window.matchMedia('(pointer: fine)').matches &&
      window.matchMedia('(hover: hover)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !window.matchMedia('(forced-colors: active)').matches;
    if (!ok) return;

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let magnet: Element | null = null;
    let frame = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        ring.dataset.visible = 'true';
      }
      const { state, el } = stateFor(e.target as Element);
      ring.dataset.state = state;
      magnet = state === 'magnetic' ? el : null;
    };
    const onLeave = () => {
      visible = false;
      ring.dataset.visible = 'false';
    };
    const onDown = () => (ring.dataset.pressed = 'true');
    const onUp = () => (ring.dataset.pressed = 'false');

    const tick = () => {
      frame = requestAnimationFrame(tick);
      let tx = x;
      let ty = y;
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        tx = x + (r.left + r.width / 2 - x) * 0.35;
        ty = y + (r.top + r.height / 2 - y) * 0.35;
      }
      rx += (tx - rx) * 0.2;
      ry += (ty - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="cursor" data-visible="false" data-state="default">
      <span className="cursor-ring" />
      <span className="cursor-label" />
    </div>
  );
}
