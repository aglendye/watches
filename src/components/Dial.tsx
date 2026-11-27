import { useId, useRef, type KeyboardEvent } from 'react';

/** Marker position in degrees clockwise from 12 o'clock: 10 at the top, 1 at 36°, 2 at 72°… */
export function markerAngle(n: number): number {
  return (n % 10) * 36;
}

/** Hand rotation for a score. 10 uses 360° so the hand keeps moving clockwise from 9. */
export function handAngle(n: number): number {
  return n * 36;
}

/** Marker the read-only hand points to for an average (rounded, clamped to 1–10). */
export function roundedMarker(avg: number): number {
  return Math.min(10, Math.max(1, Math.round(avg)));
}

const C = 100; // viewBox center
function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface FaceProps {
  /** Marker the hand points to, or null for no hand. */
  hand: number | null;
  /** Marker drawn as selected (accent color). */
  selected?: number | null;
  centerText: string;
  showNumbers?: boolean;
}

/** The drawn dial. Purely visual: aria-hidden. */
export function DialFace({ hand, selected = null, centerText, showNumbers = true }: FaceProps) {
  const minuteTicks = Array.from({ length: 50 }, (_, i) => i * 7.2).filter((d) => d % 36 !== 0);
  return (
    <svg viewBox="0 0 200 200" className="block h-full w-full" aria-hidden="true" focusable="false">
      <circle cx={C} cy={C} r={97} fill="var(--dial-face)" stroke="var(--border)" strokeWidth={2} />
      <circle cx={C} cy={C} r={91} fill="none" stroke="var(--border)" strokeWidth={0.75} />
      {minuteTicks.map((d) => {
        const a = polar(91, d);
        const b = polar(87, d);
        return <line key={d} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--muted)" strokeWidth={0.8} />;
      })}
      {SCORES.map((n) => {
        const deg = markerAngle(n);
        const on = n === selected;
        const a = polar(90, deg);
        const b = polar(n === 10 ? 74 : 78, deg);
        const t = polar(62, deg);
        return (
          <g key={n}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={on ? 'var(--accent)' : 'var(--dial-ink)'}
              strokeWidth={n === 10 ? 5 : 3.5}
              strokeLinecap="round"
            />
            {showNumbers && (
              <text
                x={t.x}
                y={t.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={n === 10 ? 15 : 13}
                fontWeight={on ? 700 : 500}
                fill={on ? 'var(--accent)' : 'var(--dial-ink)'}
                className="tabular"
              >
                {n}
              </text>
            )}
          </g>
        );
      })}
      {/* Center ring with the score */}
      <circle cx={C} cy={C} r={27} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
      <text
        x={C}
        y={C + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={centerText.length > 2 ? 17 : 22}
        fontWeight={700}
        fill="var(--text)"
        className="tabular"
      >
        {centerText}
      </text>
      {/* Hand: a pointer from the center ring out toward the chosen marker */}
      {hand !== null && (
        <g className="dial-hand" style={{ transform: `rotate(${handAngle(hand)}deg)`, transformOrigin: '100px 100px' }}>
          <path d="M 97 72 L 100 49 L 103 72 Z" fill="var(--accent)" />
        </g>
      )}
    </svg>
  );
}

interface DialProps {
  value: number | null;
  onChange(score: number): void;
  label?: string;
}

/** Interactive dial: ten marker buttons in a radio group, plus a plain row of numbered buttons. */
export function Dial({ value, onChange, label = 'Score' }: DialProps) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function move(e: KeyboardEvent, current: number) {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = current === 10 ? 1 : current + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = current === 1 ? 10 : current - 1;
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = 10;
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    refs.current[next - 1]?.focus();
  }

  const focusable = value ?? 1;

  return (
    <div>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="relative mx-auto aspect-square w-full max-w-[19rem] min-w-[17.5rem]"
      >
        <DialFace hand={value} selected={value} centerText={value === null ? '–' : String(value)} />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const p = polar(70, markerAngle(n));
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`Score ${n} of 10`}
              tabIndex={n === focusable ? 0 : -1}
              onClick={() => onChange(n)}
              onKeyDown={(e) => move(e, value ?? n)}
              className="absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${p.x / 2}%`, top: `${p.y / 2}%` }}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-10 gap-1" aria-label="Choose a score">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${n}`}
            onClick={() => onChange(n)}
            className={`tabular min-h-11 rounded-lg text-sm font-semibold ${
              value === n ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
