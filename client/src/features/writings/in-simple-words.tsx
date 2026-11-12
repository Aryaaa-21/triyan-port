import type { ReactNode } from 'react';
import { Label } from '@/components/editorial';

/**
 * A plain-language way into a piece. It is the archive's reading, not the author's, and
 * the small print says so: a poem means more than any one explanation of it.
 */
export function InSimpleWords({ children }: { children: ReactNode }) {
  return (
    <section aria-label="In simple words" className="mt-12 border-l border-border-strong pl-6">
      <Label as="p">In simple words</Label>
      <p className="mt-4 font-reading text-base leading-prose text-fg-muted">{children}</p>
      <p className="mt-3 font-mono text-[0.625rem] tracking-[0.14em] text-fg-subtle uppercase">
        A reading from the archive, not the author&rsquo;s own note
      </p>
    </section>
  );
}
