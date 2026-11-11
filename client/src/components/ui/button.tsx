import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  solid: 'bg-fg text-bg hover:bg-accent',
  outline: 'border border-border-strong text-fg hover:border-fg hover:bg-surface',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface',
  link: 'text-fg underline decoration-border-strong hover:decoration-current px-0',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const base = cn(
  'inline-flex items-center justify-center gap-2',
  'font-mono tracking-[0.18em] uppercase',
  'transition-colors duration-[var(--dur-base)] ease-void',
  'disabled:cursor-not-allowed disabled:opacity-40',
);

const classes = (variant: ButtonVariant, size: ButtonSize, className?: string) =>
  cn(
    base,
    VARIANTS[variant],
    variant === 'link' ? SIZES[size].replace(/px-\d+(\.\d+)?/, '') : SIZES[size],
    className,
  );

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'outline', size = 'md', className, ...rest }: ButtonProps) {
  return <button className={classes(variant, size, className)} {...rest} />;
}

export type ButtonLinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * A link that looks like a button. Separate from `Button` on purpose: a navigation
 * target must be an anchor so it keeps middle-click, copy-link and screen-reader
 * semantics.
 */
export function ButtonLink({
  variant = 'outline',
  size = 'md',
  className,
  ...rest
}: ButtonLinkProps) {
  return <a className={cn(classes(variant, size, className), 'no-underline')} {...rest} />;
}
