'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface TypewriterSegment {
  text: string;
  className?: string;
}

/**
 * Text typed out, letter by letter, when it scrolls into view — with a blinking caret.
 *
 * - The whole text is always in the page. What is not yet typed is only transparent,
 *   so the block never changes size or reflows while typing, screen readers read it
 *   whole, and without JavaScript it simply shows.
 * - The rhythm is human: a little uneven, with pauses after commas and full stops.
 * - Under reduced motion the text is just there, with no caret.
 * - Segments let one passage mix styles (a lead sentence, a quieter one after it).
 */
export function Typewriter({
  segments,
  className,
  speed = 34,
}: {
  segments: TypewriterSegment[];
  className?: string;
  /** Average ms per letter. */
  speed?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const total = segments.reduce((n, s) => n + s.text.length, 0);
  // Starts complete, so the server render (and a page without JavaScript) shows it all.
  const [count, setCount] = useState(total);
  const [typing, setTyping] = useState(false);
  const full = segments.map((s) => s.text).join('');

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setCount(0);
    setTyping(true);
    let timer = 0;
    let typed = 0;
    const next = () => {
      typed += 1;
      setCount(typed);
      if (typed >= full.length) return;
      const char = full[typed - 1] ?? '';
      const pause = char === '.' ? 380 : char === ',' ? 200 : 0;
      timer = window.setTimeout(next, speed * (0.55 + Math.random() * 0.9) + pause);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(next, 300);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [full, speed]);

  // Where each segment starts in the whole text.
  const offsets = segments.map((_, i) =>
    segments.slice(0, i).reduce((n, s) => n + s.text.length, 0),
  );
  return (
    <p ref={ref} className={className}>
      {segments.map((segment, i) => {
        const offset = offsets[i] ?? 0;
        const shown = Math.min(Math.max(count - offset, 0), segment.text.length);
        // The caret sits where typing is happening: in the first segment not yet complete,
        // or at the very end once everything is typed.
        const isLast = i === segments.length - 1;
        const caretHere =
          typing && (shown < segment.text.length ? count >= offset : isLast && count >= total);
        return (
          // Index keys: the segments are static for the life of the component.
          <span key={i} className={segment.className}>
            {segment.text.slice(0, shown)}
            {caretHere && <span aria-hidden="true" className="typewriter-caret" />}
            <span className={cn(shown < segment.text.length && 'typewriter-rest')}>
              {segment.text.slice(shown)}
            </span>
          </span>
        );
      })}
    </p>
  );
}
