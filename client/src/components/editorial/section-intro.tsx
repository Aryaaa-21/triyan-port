import { cn } from '@/lib/cn';

/**
 * The chapter marker the homepage is built from: "03 — WORDS" over a hairline.
 * Numbering makes the page read as a sequence, not a stack of sections.
 */
export function SectionIntro({
  index,
  label,
  className,
}: {
  index?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4', className)} aria-hidden="true">
      <span className="font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase tabular-nums">
        {index ? `${index} — ${label}` : label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
