import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './button';

interface Ask {
  title: string;
  body?: string;
  confirmLabel?: string;
  resolve: (yes: boolean) => void;
}

/**
 * A confirmation asked in the site's own voice instead of the browser's grey box.
 * `const [confirm, dialog] = useConfirm()` — render `dialog` once, then
 * `if (await confirm({ title: 'Delete this?' })) …`. Built on <dialog>, so focus is
 * trapped, Escape cancels, and the page behind is inert while it is open.
 */
export function useConfirm(): [(ask: Omit<Ask, 'resolve'>) => Promise<boolean>, ReactNode] {
  const [ask, setAsk] = useState<Ask | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  const confirm = useCallback(
    (next: Omit<Ask, 'resolve'>) => new Promise<boolean>((resolve) => setAsk({ ...next, resolve })),
    [],
  );

  useEffect(() => {
    if (ask && ref.current && !ref.current.open) ref.current.showModal();
  }, [ask]);

  const answer = (yes: boolean) => {
    ask?.resolve(yes);
    ref.current?.close();
    setAsk(null);
  };

  const dialog = ask ? (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        answer(false);
      }}
      onClick={(event) => {
        if (event.target === ref.current) answer(false);
      }}
      className="confirm-dialog m-auto w-[min(28rem,calc(100vw-2rem))] border border-border-strong bg-bg p-0 text-fg"
    >
      <div className="p-8">
        <h2 id="confirm-title" className="font-display text-2xl leading-snug font-light">
          {ask.title}
        </h2>
        {ask.body && (
          <p className="mt-3 font-reading text-base leading-prose text-fg-muted">{ask.body}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => answer(false)} autoFocus>
            Cancel
          </Button>
          <Button type="button" variant="solid" onClick={() => answer(true)}>
            {ask.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </div>
    </dialog>
  ) : null;

  return [confirm, dialog];
}
