import { badRequest } from './errors.js';

type Params = Record<string, unknown>;

export function str(p: Params, key: string, opts: { min?: number; max?: number } = {}): string {
  const v = p[key];
  if (typeof v !== 'string') throw badRequest(`${key} is required.`);
  const s = v.trim();
  if (opts.min !== undefined && s.length < opts.min) throw badRequest(`${key} is too short.`);
  if (opts.max !== undefined && s.length > opts.max) throw badRequest(`${key} is too long.`);
  return s;
}

/** Optional string: missing or blank becomes null. */
export function optStr(p: Params, key: string, max = 200): string | null {
  const v = p[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw badRequest(`${key} must be text.`);
  const s = v.trim();
  if (s.length > max) throw badRequest(`${key} is too long.`);
  return s === '' ? null : s;
}

export function optNum(p: Params, key: string, { integer = false } = {}): number | null {
  const v = p[key];
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n)))
    throw badRequest(`${key} must be a number.`);
  return n;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(p: Params, key: string): string {
  const v = p[key];
  if (typeof v !== 'string' || !UUID.test(v)) throw badRequest(`${key} is not valid.`);
  return v;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function date(p: Params, key: string): string {
  const v = p[key];
  if (typeof v !== 'string' || !DATE.test(v) || Number.isNaN(Date.parse(v)))
    throw badRequest('Choose a valid date.');
  // Allow one day of slack for time zones; the app also blocks future dates.
  const tomorrowUtc = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);
  if (v > tomorrowUtc) throw badRequest('The date rated can’t be in the future.');
  if (v < '1900-01-01') throw badRequest('Choose a valid date.');
  return v;
}

/** Optional past-or-today date (YYYY-MM-DD); missing or blank becomes null. */
export function optPastDate(p: Params, key: string, label: string): string | null {
  const v = p[key];
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !DATE.test(v) || Number.isNaN(Date.parse(v)) || v < '1900-01-01')
    throw badRequest(`Choose a valid ${label}.`);
  const tomorrowUtc = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);
  if (v > tomorrowUtc) throw badRequest(`The ${label} can’t be in the future.`);
  return v;
}

export function score(p: Params): number {
  const v = p.score;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 10)
    throw badRequest('Pick a score from 1 to 10.');
  return v;
}

export function email(p: Params): string {
  const s = str(p, 'email', { max: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw badRequest('Enter a valid email address.');
  return s;
}

export function password(p: Params): string {
  const v = p.password;
  if (typeof v !== 'string' || v.length < 8)
    throw badRequest('Password must be at least 8 characters.');
  if (v.length > 200) throw badRequest('Password is too long.');
  return v;
}

/** Escape LIKE wildcards in user input. */
export function likePrefix(s: string): string {
  return s.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
}
