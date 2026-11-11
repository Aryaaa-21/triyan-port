'use client';

import { useSyncExternalStore } from 'react';
import {
  THEME_LABELS,
  type Theme,
  applyTheme,
  getThemeServerSnapshot,
  getThemeSnapshot,
  storeTheme,
  subscribeToTheme,
} from '@/lib/theme';
import { cn } from '@/lib/cn';

/**
 * Day/night switch.
 *
 * The current environment lives in the DOM — the pre-paint script in the document
 * head has already applied it — so this subscribes to it with `useSyncExternalStore`
 * rather than copying it into component state inside an effect. The server snapshot
 * is null because the server cannot know the reader's preference; the control stays
 * operable and simply reads "Theme" until it does.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const next: Theme = theme === 'manuscript' ? 'void' : 'manuscript';

  const flip = () => {
    applyTheme(next);
    storeTheme(next);
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={
        theme
          ? `Switch to ${next === 'manuscript' ? 'day' : 'night'} (${THEME_LABELS[next]})`
          : 'Switch colour theme'
      }
      className={cn(
        'inline-flex items-center gap-2 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase transition-colors hover:text-fg',
        className,
      )}
    >
      {/* A filled or hollow disc: night and day, without an icon set. */}
      <span
        aria-hidden="true"
        className={cn(
          'inline-block size-2 rounded-full border border-current',
          next === 'void' && 'bg-current',
        )}
      />
      {theme ? (next === 'manuscript' ? 'Day' : 'Night') : 'Theme'}
    </button>
  );
}
