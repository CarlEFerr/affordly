// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { selectCompleteMonths } from '../../lib/analysis/months';
import type { FinancialHistory } from '../../lib/analysis/types';

// Fixed test date: October 15, 2026 (UTC)
// M = "2026-10" (current, excluded)
// M-1="2026-09"  M-2="2026-08"  M-3="2026-07"
// M-4="2026-06"  M-5="2026-05"  M-6="2026-04"
const TODAY = new Date('2026-10-15T12:00:00Z');

function makeHistory(
  firstSupportedMonth: string | null,
  txDates: string[] = []
): FinancialHistory {
  return {
    source: 'demo',
    accountName: 'Test',
    firstSupportedMonth,
    transactions: txDates.map((date, i) => ({
      id: String(i),
      date,
      amount: 100,
      description: `tx-${i}`,
    })),
  };
}

// ─── Basic coverage rules ─────────────────────────────────────────────────────

describe('selectCompleteMonths — coverage rules', () => {
  it('returns all 6 months when firstSupportedMonth = M-6 (Demo Mode scenario)', () => {
    const result = selectCompleteMonths(makeHistory('2026-04'), TODAY);
    expect(result).toEqual([
      '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04',
    ]);
  });

  it('returns exactly 3 months when firstSupportedMonth = M-3', () => {
    const result = selectCompleteMonths(makeHistory('2026-07'), TODAY);
    expect(result).toEqual(['2026-09', '2026-08', '2026-07']);
  });

  it('returns 4 months when firstSupportedMonth = M-4', () => {
    const result = selectCompleteMonths(makeHistory('2026-06'), TODAY);
    expect(result).toEqual(['2026-09', '2026-08', '2026-07', '2026-06']);
  });

  it('returns 5 months when firstSupportedMonth = M-5', () => {
    const result = selectCompleteMonths(makeHistory('2026-05'), TODAY);
    expect(result).toHaveLength(5);
    expect((result as string[])[0]).toBe('2026-09');
    expect((result as string[])[4]).toBe('2026-05');
  });
});

// ─── Ineligible cases ─────────────────────────────────────────────────────────

describe('selectCompleteMonths — ineligible cases', () => {
  it('returns ineligible when firstSupportedMonth = M-2 (only 2 months)', () => {
    const result = selectCompleteMonths(makeHistory('2026-08'), TODAY);
    expect(result).toEqual({ ineligible: true, reason: 'insufficient-history' });
  });

  it('returns ineligible when firstSupportedMonth = M-1 (only 1 month)', () => {
    const result = selectCompleteMonths(makeHistory('2026-09'), TODAY);
    expect(result).toEqual({ ineligible: true, reason: 'insufficient-history' });
  });

  it('returns ineligible when firstSupportedMonth is null', () => {
    const result = selectCompleteMonths(makeHistory(null), TODAY);
    expect(result).toEqual({ ineligible: true, reason: 'insufficient-history' });
  });

  it('returns ineligible when firstSupportedMonth is newer than M-1', () => {
    // "2026-11" is in the future relative to our candidates — nothing qualifies
    const result = selectCompleteMonths(makeHistory('2026-11'), TODAY);
    expect(result).toEqual({ ineligible: true, reason: 'insufficient-history' });
  });
});

// ─── Contiguous window — zero-transaction months included ──────────────────────

describe('selectCompleteMonths — zero-transaction interior months', () => {
  it('includes M-3 even when it has no transactions (coverage, not presence)', () => {
    // firstSupportedMonth = M-6; M-3 has no transactions
    const history = makeHistory('2026-04', [
      '2026-09-15', '2026-08-10', // M-1, M-2
      // no transactions in 2026-07 (M-3)
      '2026-06-20', '2026-05-05', '2026-04-15', // M-4, M-5, M-6
    ]);
    const result = selectCompleteMonths(history, TODAY) as string[];
    expect(result).toContain('2026-07'); // M-3 included despite zero transactions
    expect(result).toHaveLength(6);
  });

  it('produces a contiguous result (no gaps) regardless of transaction distribution', () => {
    const history = makeHistory('2026-04', [
      '2026-09-01', // only one month has a transaction
    ]);
    const result = selectCompleteMonths(history, TODAY) as string[];
    // All 6 must be present in order — no gaps
    expect(result).toEqual([
      '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04',
    ]);
  });
});

// ─── History older than analysis window ───────────────────────────────────────

describe('selectCompleteMonths — deep history', () => {
  it('caps at 6 months when firstSupportedMonth predates M-6', () => {
    const result = selectCompleteMonths(makeHistory('2025-01'), TODAY);
    expect(result).toHaveLength(6);
    expect(result).toEqual([
      '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04',
    ]);
  });

  it('caps at 6 even with very old firstSupportedMonth', () => {
    const result = selectCompleteMonths(makeHistory('2000-01'), TODAY);
    expect(result).toHaveLength(6);
  });
});

// ─── Current month exclusion ──────────────────────────────────────────────────

describe('selectCompleteMonths — current month excluded', () => {
  it('never includes the current calendar month', () => {
    const result = selectCompleteMonths(makeHistory('2026-04'), TODAY) as string[];
    expect(result).not.toContain('2026-10'); // October 2026 is the current month
  });
});

// ─── Year-boundary month arithmetic ──────────────────────────────────────────

describe('selectCompleteMonths — year boundaries', () => {
  it('January today: M-1 is December of previous year', () => {
    const jan2026 = new Date('2026-01-15T12:00:00Z');
    // M-6 = 2025-07
    const result = selectCompleteMonths(makeHistory('2025-07'), jan2026) as string[];
    expect(result[0]).toBe('2025-12'); // M-1
    expect(result[5]).toBe('2025-07'); // M-6
    expect(result).toHaveLength(6);
  });

  it('February today: M-1 is January, M-6 crosses prior year', () => {
    const feb2026 = new Date('2026-02-15T12:00:00Z');
    // M-6 = 2025-08
    const result = selectCompleteMonths(makeHistory('2025-08'), feb2026) as string[];
    expect(result[0]).toBe('2026-01'); // M-1
    expect(result[5]).toBe('2025-08'); // M-6
    expect(result).toHaveLength(6);
  });
});
