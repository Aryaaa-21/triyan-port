import { useEffect, useRef, useState } from 'react';
import type { CategoryKey } from '@triyan/shared';
import { SubscribeForm } from './subscribe-form';

const KEY = 'triyan-interest-popup';
/** After "not now", the invitation stays away this long. */
const QUIET_DAYS = 14;
/** Long enough to see the page first; short enough to arrive before the reader leaves. */
const DELAY_MS = 2500;

const shouldInvite = (): boolean => {
  try {
    const seen = localStorage.getItem(KEY);
    if (!seen) return true;
    if (seen === 'subscribed') return false;
    return Date.now() - Number(seen) > QUIET_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Storage is blocked: without a way to remember "not now", do not ask at all.
    return false;
  }
};

const remember = (value: string): void => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Nothing to do: see shouldInvite.
  }
};

/**
 * The invitation shown on entering the Writings page: choose the shelves you care
 * about, leave an address, and hear when something new is placed on them.
 *
 * It asks once. Closing it — the button, Escape, or a click outside — is remembered for
 * two weeks, and subscribing is remembered for good. Built on <dialog>, so focus stays
 * inside while it is open and returns to the page when it closes.
 */
export function InterestPopup({ current }: { current?: CategoryKey | undefined }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!shouldInvite()) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  const close = () => {
    if (!done) remember(String(Date.now()));
    ref.current?.close();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="interest-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
      className="confirm-dialog interest-popup m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto border border-border-strong bg-bg p-0 text-fg"
    >
      <div className="relative p-7 sm:p-10">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 flex size-10 items-center justify-center font-mono text-lg text-fg-subtle transition-colors hover:text-fg"
        >
          <span aria-hidden="true">×</span>
        </button>

        {!done && (
          <>
            <p className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase">
              Before you read
            </p>
            <h2
              id="interest-title"
              // Focus starts on the question, not on the close button.
              tabIndex={-1}
              autoFocus
              className="mt-4 pr-8 outline-none font-display text-[clamp(2rem,6vw,3rem)] leading-[1.02] font-light tracking-tight"
            >
              What are you <span className="text-fg-muted italic">looking for?</span>
            </h2>
            <p className="mt-4 mb-8 font-reading text-base leading-prose text-fg-muted">
              Choose the shelves that speak to you and leave your email. When Triyan places
              something new on them, it will reach you.
            </p>
          </>
        )}
        {done && (
          <h2 id="interest-title" className="sr-only">
            Subscribed
          </h2>
        )}

        <SubscribeForm
          chooseInterests
          label="Your email"
          className="relative"
          {...(current ? { initialInterests: [current] } : {})}
          onDone={() => {
            remember('subscribed');
            setDone(true);
          }}
        />

        <div className="mt-8">
          <button
            type="button"
            onClick={close}
            className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase transition-colors hover:text-fg"
          >
            {done ? 'Continue reading →' : 'Not now'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
