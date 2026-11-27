// Small shared building blocks: buttons, fields, states, badges.
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost';

const KIND: Record<ButtonKind, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'bg-surface-2 text-ink',
  danger: 'bg-transparent text-danger border border-current',
  ghost: 'bg-transparent text-accent',
};

export function Button({
  kind = 'primary',
  className = '',
  busy = false,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: ButtonKind; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition-opacity disabled:opacity-45 ${KIND[kind]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string | null }) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint || error ? hintId : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
        className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-muted disabled:opacity-60"
      />
      {(hint || error) && (
        <p id={hintId} className={`mt-1 text-sm ${error ? 'text-danger' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line px-4 py-8 text-center">
      <p className="text-muted">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <div role="alert" className="rounded-card border border-line bg-surface px-4 py-6 text-center">
      <p className="text-ink">{message}</p>
      <Button kind="secondary" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function SkeletonRows({ rows = 4, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-16" />
      ))}
    </div>
  );
}

export function ScoreBadge({ score, className = '' }: { score: number; className?: string }) {
  return (
    <span
      className={`tabular inline-grid size-10 shrink-0 place-items-center rounded-full border-2 border-accent text-sm font-bold text-accent ${className}`}
      aria-label={`${score} out of 10`}
    >
      {score}
    </span>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="label mb-2">
      {children}
    </h2>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-surface ${className}`}>{children}</div>;
}
