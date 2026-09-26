/**
 * UTC-safe calendar-month utilities.
 *
 * All month-boundary calculations use UTC to avoid local-timezone edge cases
 * (e.g. a machine in UTC-5 seeing "October 1 00:00 local" as "September 30 UTC").
 *
 * The `today` parameter is injectable throughout to support deterministic tests.
 */

import type { MonthKey } from '../analysis/types';

const MONTH_NAMES: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Returns the MonthKey for the calendar month that is `offsetMonths` before `today`.
 *
 * @param today - reference date (inject for deterministic tests)
 * @param offsetMonths - months to subtract: 0 = current month, 1 = M−1, 6 = M−6
 *
 * @example
 *   monthKeyAt(new Date('2026-01-15T00:00:00Z'), 1) → "2025-12"  // Jan → Dec previous year
 *   monthKeyAt(new Date('2026-10-15T00:00:00Z'), 6) → "2026-04"
 */
export function monthKeyAt(today: Date, offsetMonths: number): MonthKey {
  // Express as total months since the epoch anchor (year 0, month 0)
  // then subtract the offset. Using integer arithmetic avoids Date mutation.
  const totalMonths =
    today.getUTCFullYear() * 12 + today.getUTCMonth() - offsetMonths;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12; // 0-indexed (0 = January)
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Returns the MonthKey for the current calendar month.
 * Equivalent to monthKeyAt(today, 0).
 */
export function currentMonthKey(today: Date = new Date()): MonthKey {
  return monthKeyAt(today, 0);
}

/**
 * Formats a MonthKey as a human-readable label.
 * @example monthKeyToLabel("2026-03") → "March 2026"
 */
export function monthKeyToLabel(key: MonthKey): string {
  const [yearStr, monthStr] = key.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Extracts the MonthKey from an ISO date string ("YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SSZ").
 * @example monthKeyFromDate("2026-03-15") → "2026-03"
 */
export function monthKeyFromDate(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

/**
 * Returns the MonthKey for the calendar month immediately following `key`.
 * Used by the Plaid adapter to derive firstSupportedMonth from the boundary month.
 *
 * @example nextMonthKey("2025-12") → "2026-01"
 * @example nextMonthKey("2026-03") → "2026-04"
 */
export function nextMonthKey(key: MonthKey): MonthKey {
  const [yearStr, monthStr] = key.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
