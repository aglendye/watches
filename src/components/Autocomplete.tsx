import { useId, useState, type KeyboardEvent } from 'react';

interface Props {
  label: string;
  value: string;
  onChange(v: string): void;
  suggestions: string[];
  hint?: string;
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}

/** Text field with a suggestion list (ARIA combobox). Free text is always allowed. */
export function Autocomplete({ label, value, onChange, suggestions, hint, required, autoFocus, maxLength }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Hide a suggestion that exactly matches what's typed.
  const items = suggestions.filter((s) => s.toLowerCase() !== value.trim().toLowerCase());
  const expanded = open && items.length > 0;

  function pick(s: string) {
    onChange(s);
    setOpen(false);
    setActive(-1);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!expanded) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {!required && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        required={required}
        autoFocus={autoFocus}
        maxLength={maxLength}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
        className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label={`${label} suggestions`}
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
      >
        {items.map((s, i) => (
          <li
            key={s}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(s)}
            className={`flex min-h-11 cursor-pointer items-center px-3 ${i === active ? 'bg-accent-soft' : ''}`}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
