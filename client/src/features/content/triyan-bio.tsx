import { cn } from '@/lib/cn';
import { BIO_INTRO, PORTRAIT_BIO, PORTRAIT_BIO_CLOSE } from '@/content/triyan';

/**
 * Triyan's bio, word for word as supplied: a lead paragraph, the second quieter, and
 * the closing line set apart. Shared by the homepage's Triyan section and About.
 */
export function TriyanBio({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-xl', className)}>
      <p className="font-reading text-xl leading-prose text-fg">{BIO_INTRO}</p>
      <p className="mt-6 font-reading text-lg leading-prose text-fg-muted">{PORTRAIT_BIO}</p>
      <p className="mt-10 font-display text-[clamp(1.6rem,2.4vw,2rem)] leading-snug font-light text-fg italic">
        {PORTRAIT_BIO_CLOSE}
      </p>
    </div>
  );
}
