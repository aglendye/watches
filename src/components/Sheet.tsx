import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
  /** 'bottom' slides up from the bottom (sheets); 'center' is a dialog. */
  variant?: 'bottom' | 'center';
}

/** Modal sheet or dialog: traps focus, closes on Escape and backdrop tap, restores focus. */
export function Sheet({ open, onClose, title, children, variant = 'bottom' }: Props) {
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
        className={`relative max-h-[92dvh] w-full overflow-y-auto bg-surface text-ink shadow-xl outline-none ${
          bottom
            ? 'max-w-lg rounded-t-2xl px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'
            : 'max-w-sm rounded-2xl p-5'
        }`}
      >
        {bottom && <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />}
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="serif text-2xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 grid size-11 place-items-center rounded-full text-muted"
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
