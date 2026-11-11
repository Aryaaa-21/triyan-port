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

/**
 * Day/night switch.
 *
 * The current environment lives in the DOM — the pre-paint script in the document
 * head has already applied it — so this subscribes to it with `useSyncExternalStore`
 * rather than copying it into component state inside an effect. The server snapshot
 * is null because the server cannot know the reader's preference; the control stays
 * operable and simply reads "Theme" until it does.
 */
export function ThemeToggle() {
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
      aria-label={theme ? `Switch to ${THEME_LABELS[next]} mode` : 'Switch colour theme'}
      className="font-ui text-2xs tracking-widest text-fg-subtle uppercase transition-colors hover:text-fg"
    >
      {theme ? THEME_LABELS[next] : 'Theme'}
    </button>
  );
}
