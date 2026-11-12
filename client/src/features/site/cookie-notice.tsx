import { useState } from 'react';

const KEY = 'triyan-notice-seen';

/**
 * The cookie notice, said honestly: the site sets no tracking or advertising cookies,
 * so there is nothing to consent to — only something to know. It keeps the reader's
 * light/dark choice on their own device, and shows this once.
 */
export function CookieNotice() {
  // Read once, as the page opens. The site is rendered in the browser, so storage is there.
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(KEY);
    } catch {
      return false;
    }
  });

  if (!open) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Storage is blocked: the notice will simply show again next time.
    }
    setOpen(false);
  };

  return (
    <aside
      aria-label="About cookies"
      className="cookie-notice fixed bottom-32 left-4 z-(--z-sticky) max-w-[min(22rem,calc(100vw-2rem))] border border-border-strong bg-bg/95 p-5 backdrop-blur sm:bottom-6 sm:left-6"
    >
      <p className="font-reading text-sm leading-prose text-fg-muted">
        No tracking, no advertising cookies. This site only remembers your light or dark choice and
        what you have dismissed, on your own device.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-4 font-mono text-2xs tracking-[0.18em] text-fg uppercase transition-colors hover:text-accent"
      >
        Understood
      </button>
    </aside>
  );
}
