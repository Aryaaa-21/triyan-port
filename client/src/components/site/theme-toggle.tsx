'use client';

import { useSyncExternalStore } from 'react';
import {
  type Theme,
  applyTheme,
  getThemeServerSnapshot,
  getThemeSnapshot,
  storeTheme,
  subscribeToTheme,
} from '@/lib/theme';
import { cn } from '@/lib/cn';

/**
 * Day / night switch: a small track with a sun at one end, a moon at the other, and
 * a knob that slides between them. It is a real switch to assistive technology
 * ("Night mode", on or off).
 *
 * The current environment lives in the DOM — the pre-paint script has already
 * applied it — so this subscribes with `useSyncExternalStore` instead of copying it
 * into state. The server cannot know the reader's choice, so until hydration the
 * knob rests in the middle.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const night = theme !== 'manuscript';

  const flip = () => {
    const next: Theme = night ? 'manuscript' : 'void';
    applyTheme(next);
    storeTheme(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme ? night : undefined}
      aria-label="Night mode"
      title={night ? 'Switch to day' : 'Switch to night'}
      onClick={flip}
      data-state={theme ? (night ? 'night' : 'day') : 'unknown'}
      className={cn(
        'theme-switch relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border border-border-strong text-fg-subtle transition-colors duration-500 hover:border-fg-muted hover:text-fg',
        className,
      )}
    >
      {/* Sun */}
      <svg aria-hidden="true" viewBox="0 0 16 16" className="theme-sun absolute left-1.5 size-3">
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      {/* Moon */}
      <svg aria-hidden="true" viewBox="0 0 16 16" className="theme-moon absolute right-1.5 size-3">
        <path d="M11.5 10.6A5 5 0 0 1 5.4 4.5a5 5 0 1 0 6.1 6.1Z" fill="currentColor" />
      </svg>
      {/* Knob */}
      <span
        aria-hidden="true"
        className="theme-knob absolute top-1/2 left-[3px] size-4 rounded-full bg-fg"
      />
    </button>
  );
}
