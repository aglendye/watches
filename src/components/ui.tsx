// Small shared building blocks: buttons, fields, states, badges.
import { Link, useNavigate } from 'react-router-dom';
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost';

const KIND: Record<ButtonKind, string> = {
  primary: 'bg-accent text-on-accent font-display text-lg font-extrabold uppercase tracking-[0.06em]',
  secondary: 'border border-line bg-transparent text-ink font-display text-lg font-extrabold uppercase tracking-[0.06em]',
  danger: 'border border-current bg-transparent text-danger font-display text-lg font-extrabold uppercase tracking-[0.06em]',
  ghost: 'bg-transparent text-accent font-semibold',
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
      className={`inline-flex min-h-12 items-center justify-center gap-2 px-5 transition-opacity disabled:opacity-45 ${KIND[kind]} ${className}`}
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
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint || error ? hintId : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
        className="min-h-12 w-full border border-line bg-surface px-3 text-base text-ink placeholder:text-muted disabled:opacity-60"
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
    <p role="alert" className="border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
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
      className={`num inline-block w-9 shrink-0 text-center text-3xl text-accent ${className}`}
      aria-label={`${score} out of 10`}
    >
      {score}
    </span>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="label mb-3 flex items-center gap-2">
      <DivePip />
      {children}
    </h2>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-surface ${className}`}>{children}</div>;
}

/** The small orange triangle from a dive bezel's 12 o'clock: the app's marker. */
export function DivePip({ className = 'h-2 w-2.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 8" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M0 0H10L5 8Z" fill="var(--accent)" />
    </svg>
  );
}

/** "▼ BEZEL" wordmark. */
export function Wordmark({ size = 'text-[2rem]' }: { size?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <DivePip className="h-[0.7rem] w-[0.875rem]" />
      <span className={`display leading-none ${size}`}>Bezel</span>
    </span>
  );
}

/**
 * "‹ Back" at the top of a screen. Goes back to wherever you came from (a
 * list, your collection, search results…); when the screen was opened
 * directly, it goes to `to` and says where.
 */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  const navigate = useNavigate();
  const canGoBack = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0;
  return (
    <Link
      to={to}
      onClick={(e) => {
        if (!canGoBack) return;
        e.preventDefault();
        navigate(-1);
      }}
      className="inline-flex min-h-11 items-center font-semibold text-accent"
    >
      ‹ {canGoBack ? 'Back' : children}
    </Link>
  );
}

/** A ruled navigation row: label on the left, optional detail and a chevron on the right. */
export function NavRow({ to, label, detail }: { to: string; label: string; detail?: string }) {
  return (
    <Link to={to} className="flex min-h-14 items-center justify-between gap-3 border-b border-line">
      <span className="display text-2xl">{label}</span>
      <span className="flex items-center gap-3 text-muted">
        {detail && <span className="mono text-sm">{detail}</span>}
        <span aria-hidden="true" className="text-2xl">
          ›
        </span>
      </span>
    </Link>
  );
}
