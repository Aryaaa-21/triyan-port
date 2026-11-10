import { cn } from '@/lib/cn';

export interface RuleProps {
  /** An optional label sits inside the rule, as an editorial section marker. */
  label?: string;
  className?: string;
}

/** An editorial hairline. Decorative by default, so it is hidden from assistive tech. */
export function Rule({ label, className }: RuleProps) {
  if (!label) {
    return <hr aria-hidden="true" className={cn('border-border', className)} />;
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">{label}</span>
      <hr aria-hidden="true" className="flex-1 border-border" />
    </div>
  );
}
