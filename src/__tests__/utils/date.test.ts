// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  monthKeyAt,
  currentMonthKey,
  monthKeyToLabel,
  monthKeyFromDate,
  nextMonthKey,
} from '../../lib/utils/date';

// ─── monthKeyAt ───────────────────────────────────────────────────────────────

describe('monthKeyAt', () => {
  it('returns the current month when offset = 0', () => {
    const oct2026 = new Date('2026-10-15T12:00:00Z');
    expect(monthKeyAt(oct2026, 0)).toBe('2026-10');
  });

  it('returns M-1 (previous month) correctly', () => {
    const oct2026 = new Date('2026-10-15T12:00:00Z');
    expect(monthKeyAt(oct2026, 1)).toBe('2026-09');
  });

  it('returns M-6 correctly', () => {
    const oct2026 = new Date('2026-10-15T12:00:00Z');
    expect(monthKeyAt(oct2026, 6)).toBe('2026-04');
  });

  // Year-boundary cases — the most important correctness tests

  it('January M-1 → December of previous year', () => {
    const jan2026 = new Date('2026-01-15T12:00:00Z');
    expect(monthKeyAt(jan2026, 1)).toBe('2025-12');
  });

  it('January M-6 → July of previous year', () => {
    const jan2026 = new Date('2026-01-15T12:00:00Z');
    expect(monthKeyAt(jan2026, 6)).toBe('2025-07');
  });

  it('February M-1 → January same year', () => {
    const feb2026 = new Date('2026-02-15T12:00:00Z');
    expect(monthKeyAt(feb2026, 1)).toBe('2026-01');
  });

  it('February M-6 → August of previous year', () => {
    const feb2026 = new Date('2026-02-15T12:00:00Z');
    expect(monthKeyAt(feb2026, 6)).toBe('2025-08');
  });

  it('March M-6 → September of previous year', () => {
    const mar2026 = new Date('2026-03-15T12:00:00Z');
    expect(monthKeyAt(mar2026, 6)).toBe('2025-09');
  });

  it('zero-pads single-digit months', () => {
    const oct2026 = new Date('2026-10-15T12:00:00Z');
    expect(monthKeyAt(oct2026, 9)).toBe('2026-01');
    expect(monthKeyAt(oct2026, 1)).toBe('2026-09'); // Sep has two digits — sanity check
  });

  it('uses UTC month, not local month', () => {
    // A date that is Nov 30 UTC but Dec 1 in UTC+2 — result must follow UTC
    const nov30utc = new Date('2026-11-30T23:00:00Z');
    expect(monthKeyAt(nov30utc, 0)).toBe('2026-11'); // still November UTC
  });
});

// ─── currentMonthKey ──────────────────────────────────────────────────────────

describe('currentMonthKey', () => {
  it('returns the current UTC month', () => {
    const sep2026 = new Date('2026-09-05T10:00:00Z');
    expect(currentMonthKey(sep2026)).toBe('2026-09');
  });
});

// ─── monthKeyToLabel ──────────────────────────────────────────────────────────

describe('monthKeyToLabel', () => {
  it('formats standard months correctly', () => {
    expect(monthKeyToLabel('2026-03')).toBe('March 2026');
    expect(monthKeyToLabel('2026-09')).toBe('September 2026');
    expect(monthKeyToLabel('2025-12')).toBe('December 2025');
    expect(monthKeyToLabel('2026-01')).toBe('January 2026');
    expect(monthKeyToLabel('2027-07')).toBe('July 2027');
  });

  it('handles all twelve months', () => {
    const expected = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    for (let i = 1; i <= 12; i++) {
      const key = `2026-${String(i).padStart(2, '0')}`;
      expect(monthKeyToLabel(key)).toBe(`${expected[i - 1]} 2026`);
    }
  });
});

// ─── monthKeyFromDate ─────────────────────────────────────────────────────────

describe('monthKeyFromDate', () => {
  it('extracts month key from ISO date string', () => {
    expect(monthKeyFromDate('2026-03-15')).toBe('2026-03');
    expect(monthKeyFromDate('2026-12-01')).toBe('2026-12');
    expect(monthKeyFromDate('2025-07-31')).toBe('2025-07');
  });

  it('works with datetime strings', () => {
    expect(monthKeyFromDate('2026-09-15T10:30:00Z')).toBe('2026-09');
  });
});

// ─── nextMonthKey ─────────────────────────────────────────────────────────────

describe('nextMonthKey', () => {
  it('advances to the next month within a year', () => {
    expect(nextMonthKey('2026-03')).toBe('2026-04');
    expect(nextMonthKey('2026-09')).toBe('2026-10');
    expect(nextMonthKey('2026-01')).toBe('2026-02');
  });

  it('handles December → January of next year', () => {
    expect(nextMonthKey('2025-12')).toBe('2026-01');
    expect(nextMonthKey('2026-12')).toBe('2027-01');
  });
});
