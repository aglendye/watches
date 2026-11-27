import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  /** Small label above the title. */
  eyebrow?: string;
  children: ReactNode;
  /** 'bottom' slides up from the bottom (sheets); 'center' is a dialog. */
  variant?: 'bottom' | 'center';
}

/** Modal sheet or dialog: traps focus, closes on Escape and backdrop tap, restores focus. */
export function Sheet({ open, onClose, title, eyebrow, children, variant = 'bottom' }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const body = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the panel itself so screen readers announce the title first.
    panel.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = body;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const bottom = variant === 'bottom';
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${bottom ? 'items-end' : 'items-center p-4'} justify-center`}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative max-h-[92dvh] w-full overflow-y-auto border-t border-line bg-surface text-ink outline-none ${
          bottom
            ? 'max-w-lg px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'
            : 'max-w-sm border p-5'
        }`}
      >
        {bottom && <div className="mx-auto mb-3 h-1 w-10 bg-line" aria-hidden="true" />}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="label mb-1.5">{eyebrow}</p>}
            <h2 id={titleId} className="display text-[1.75rem] leading-[1.05]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center text-muted"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
