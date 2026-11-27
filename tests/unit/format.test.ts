import { describe, expect, it } from 'vitest';
import { formatDate, localToday, relativeTime, watchTitle } from '../../src/lib/format';
import { ApiError, errorMessage, NETWORK_MESSAGE } from '../../src/lib/api';
import { fromDbError } from '../../server/errors';

describe('watchTitle', () => {
  it('uses brand + model with the reference as secondary text', () => {
    expect(watchTitle({ brand_name: 'Omega', model_name: 'Speedmaster', reference: '310.30' })).toEqual({
      title: 'Omega Speedmaster',
      subtitle: '310.30',
      hasReference: true,
    });
  });
  it('says when the reference is not specified', () => {
    expect(watchTitle({ brand_name: 'Seiko', model_name: 'SKX007', reference: null }).subtitle).toBe(
      '(reference not specified)',
    );
    expect(watchTitle({ brand_name: 'Seiko', model_name: 'SKX007', watch_reference: 'SKX007K' }).subtitle).toBe('SKX007K');
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-12-25T12:00:00');
  it('formats recent times', () => {
    expect(relativeTime(new Date('2026-12-25T11:59:40').toISOString(), now)).toBe('just now');
    expect(relativeTime(new Date('2026-12-25T11:15:00').toISOString(), now)).toBe('45m ago');
    expect(relativeTime(new Date('2026-12-25T10:00:00').toISOString(), now)).toBe('2h ago');
    expect(relativeTime(new Date('2026-12-22T12:00:00').toISOString(), now)).toBe('3d ago');
  });
  it('switches to a short date after 7 days', () => {
    expect(relativeTime(new Date('2026-12-01T09:00:00').toISOString(), now)).toBe('Dec 1');
    expect(relativeTime(new Date('2025-11-03T09:00:00').toISOString(), now)).toBe('Nov 3, 2025');
  });
});

describe('dates', () => {
  it('formats YYYY-MM-DD without time-zone drift', () => {
    expect(formatDate('2026-03-01')).toBe('Mar 1, 2026');
  });
  it('local today', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('error mapping', () => {
  it('maps Postgres errors to friendly messages', () => {
    expect(fromDbError({ code: '23505' }).message).toBe('That already exists.');
    expect(fromDbError({ code: '42501' }).message).toBe('You don’t have permission to do that.');
    expect(fromDbError({ code: 'P0001', message: 'This watch has ratings from other people and cannot be deleted' }).message).toBe(
      'This watch has ratings from other people and cannot be deleted',
    );
    expect(fromDbError({ code: '28000' }).status).toBe(401);
  });
  it('maps network failures in the app', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe(NETWORK_MESSAGE);
    expect(errorMessage(new ApiError('conflict', 409, 'That already exists.'))).toBe('That already exists.');
  });
});
