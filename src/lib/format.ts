const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface Titled {
  brand_name: string;
  model_name: string;
  reference?: string | null;
  watch_reference?: string | null;
}

/** ‘{brand} {model}’ plus the reference (or ‘(reference not specified)’) as secondary text. */
export function watchTitle(w: Titled): { title: string; subtitle: string; hasReference: boolean } {
  const ref = w.reference ?? w.watch_reference ?? null;
  return {
    title: `${w.brand_name} ${w.model_name}`,
    subtitle: ref ?? '(reference not specified)',
    hasReference: ref !== null,
  };
}

/** Today's date in the user's local time zone, as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ‘Mar 1, 2026’ from ‘2026-03-01’ (no time-zone shifting). Drops the year if it's this year and short is set. */
export function formatDate(ymd: string, { short = false, now = new Date() } = {}): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const base = `${MONTHS[m - 1]} ${d}`;
  return short && y === now.getFullYear() ? base : `${base}, ${y}`;
}

/** ‘just now’, ‘5m ago’, ‘2h ago’, ‘3d ago’, then a short date after 7 days. */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const secs = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(localToday(then), { short: true, now });
}

export function scoreText(avg: number | null | undefined): string {
  return avg === null || avg === undefined ? '–' : avg.toFixed(1);
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`;
}
