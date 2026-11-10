'use client';

import { useState } from 'react';

/**
 * Share controls. Uses the native share sheet where the browser offers one and falls
 * back to copying the link. Deliberately placed after the poem rather than floating
 * over it.
 */
export function ShareActions({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context, denied permission). The URL is in
      // the address bar regardless, so there is nothing useful to report.
    }
  };

  const share = async () => {
    if (typeof navigator.share !== 'function') {
      await copy();
      return;
    }
    try {
      await navigator.share({ title, url });
    } catch {
      // The sheet was dismissed. Not an error.
    }
  };

  return (
    <div className="mt-16 flex items-center gap-6">
      <button
        type="button"
        onClick={() => void share()}
        className="font-ui text-2xs tracking-widest text-fg-subtle uppercase transition-colors hover:text-fg"
      >
        Share
      </button>
      <button
        type="button"
        onClick={() => void copy()}
        className="font-ui text-2xs tracking-widest text-fg-subtle uppercase transition-colors hover:text-fg"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
