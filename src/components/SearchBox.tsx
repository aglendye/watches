import { forwardRef, type FormEvent } from 'react';

interface Props {
  value: string;
  onChange(v: string): void;
  onSubmit?(v: string): void;
  autoFocus?: boolean;
}

export const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox(
  { value, onChange, onSubmit, autoFocus },
  ref,
) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit?.(value);
    (document.activeElement as HTMLElement | null)?.blur(); // hide the iPhone keyboard
  }
  return (
    <form role="search" onSubmit={submit} className="relative">
      <label htmlFor="search" className="sr-only">
        Search watches by brand, model, or reference
      </label>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        id="search"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder="Search brand, model, or reference"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-line bg-surface pr-3 pl-10 text-base text-ink placeholder:text-muted"
      />
    </form>
  );
});
