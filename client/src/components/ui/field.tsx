import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

const control = cn(
  'w-full border-0 border-b border-border-strong bg-transparent px-0 py-3',
  'font-reading text-lg text-fg placeholder:text-fg-subtle',
  'transition-colors duration-[var(--dur-base)] ease-void',
  'hover:border-fg-subtle focus:border-focus focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-ember',
);

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export type TextFieldProps = FieldShellProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-invalid' | 'aria-describedby'>;

/**
 * Label, control, hint and error wired together by id. An error is announced through
 * `role="alert"` and referenced by `aria-describedby`, so it reaches a screen reader
 * rather than only being visible.
 */
export function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} required={rest.required}>
        {label}
      </Label>
      <input
        id={id}
        className={control}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        {...rest}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export type TextAreaFieldProps = FieldShellProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-invalid' | 'aria-describedby'>;

export function TextAreaField({ label, hint, error, className, ...rest }: TextAreaFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} required={rest.required}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rest.rows ?? 5}
        className={cn(control, 'resize-y leading-prose')}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        {...rest}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-mono text-2xs tracking-[0.18em] text-fg-muted uppercase"
    >
      {children}
      {required && (
        <span className="text-fg-subtle" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  );
}

function Messages({
  hint,
  hintId,
  error,
  errorId,
}: {
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <>
      {hint && (
        <p id={hintId} className="font-ui text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="font-ui text-xs text-ember">
          {error}
        </p>
      )}
    </>
  );
}
