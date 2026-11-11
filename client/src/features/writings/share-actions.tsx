import { useState } from 'react';

type Status = '' | 'copied' | 'copied-for-instagram' | 'failed';

const MESSAGES: Record<Exclude<Status, ''>, string> = {
  copied: 'Link copied',
  'copied-for-instagram': 'Link copied — paste it into Instagram',
  failed: 'Copy failed — the link is in the address bar',
};

/**
 * Share, after the poem — never floating over it. WhatsApp and X open their own
 * share pages. Instagram has no web share link, so the honest option is the
 * device's share sheet where there is one, and otherwise copying the link.
 */
export function ShareActions({ title, url }: { title: string; url: string }) {
  const [status, setStatus] = useState<Status>('');

  const copy = async (next: Exclude<Status, '' | 'failed'>) => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus(next);
    } catch {
      setStatus('failed');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const instagram = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Dismissed, or unsupported for this payload: fall back to copying.
      }
    }
    await copy('copied-for-instagram');
  };

  const text = encodeURIComponent(`${title} — Triyan`);
  const link = encodeURIComponent(url);
  const item =
    'font-mono text-2xs tracking-[0.18em] text-fg-muted uppercase no-underline transition-colors hover:text-fg';

  return (
    <div>
      <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">Share</p>
      <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
        <li>
          <button type="button" onClick={() => void copy('copied')} className={item}>
            Copy link
          </button>
        </li>
        <li>
          <button type="button" onClick={() => void instagram()} className={item}>
            Instagram
          </button>
        </li>
        <li>
          <a
            className={item}
            href={`https://wa.me/?text=${text}%20${link}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
        <li>
          <a
            className={item}
            href={`https://x.com/intent/post?text=${text}&url=${link}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            X <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      </ul>
      <p role="status" className="mt-3 min-h-5 font-mono text-2xs tracking-[0.12em] text-fg-subtle">
        {status ? MESSAGES[status] : ''}
      </p>
    </div>
  );
}
