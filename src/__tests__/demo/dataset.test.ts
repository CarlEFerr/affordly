// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getDemoHistory } from '../../lib/adapters/demo';
import { runBacktest, isIneligible } from '../../lib/analysis/index';
import { monthKeyAt } from '../../lib/utils/date';
import { DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION } from '../../lib/demo/dataset';
import type { BacktestResult } from '../../lib/analysis/types';

// Fixed date: October 15, 2026 (UTC)
// M-1="2026-09"  M-2="2026-08"  M-3="2026-07"
// M-4="2026-06"  M-5="2026-05"  M-6="2026-04"
const TODAY = new Date('2026-10-15T12:00:00Z');

describe('getDemoHistory', () => {
  it('returns source=demo with the demo account name', () => {
    const h = getDemoHistory(TODAY);
    expect(h.source).toBe('demo');
    expect(h.accountName).toBe('Demo Checking Account');
  });

  it('sets firstSupportedMonth = M-6', () => {
    const h = getDemoHistory(TODAY);
    expect(h.firstSupportedMonth).toBe('2026-04'); // M-6 for Oct 2026
  });

  it('generates transactions with dates in the correct relative months', () => {
    const h = getDemoHistory(TODAY);
    const monthKeys = new Set(h.transactions.map(t => t.date.slice(0, 7)));
    // Should have transactions in all 6 months
    expect(monthKeys.has('2026-09')).toBe(true); // M-1
    expect(monthKeys.has('2026-08')).toBe(true); // M-2
    expect(monthKeys.has('2026-07')).toBe(true); // M-3
    expect(monthKeys.has('2026-06')).toBe(true); // M-4
    expect(monthKeys.has('2026-05')).toBe(true); // M-5
    expect(monthKeys.has('2026-04')).toBe(true); // M-6
  });

  it('does not include transactions in the current partial month', () => {
    const h = getDemoHistory(TODAY);
    const hasCurrentMonth = h.transactions.some(t => t.date.startsWith('2026-10'));
    expect(hasCurrentMonth).toBe(false);
  });

  it('produces relative dates — adapts when today changes', () => {
    const jan2027 = new Date('2027-01-15T12:00:00Z');
    const h = getDemoHistory(jan2027);
    const monthKeys = new Set(h.transactions.map(t => t.date.slice(0, 7)));
    expect(monthKeys.has('2026-12')).toBe(true); // M-1 for Jan 2027
    expect(monthKeys.has('2026-07')).toBe(true); // M-6 for Jan 2027
    expect(h.firstSupportedMonth).toBe('2026-07'); // M-6 for Jan 2027
  });
});

describe('Demo dataset integration — backtest with defaults', () => {
  it('produces exactly 6 analyzed months', () => {
    const h = getDemoHistory(TODAY);
    const output = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY);
    expect(isIneligible(output)).toBe(false);
    expect((output as BacktestResult).totalMonths).toBe(6);
  });

  it('months are contiguous and in most-recent-first order', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    const keys = result.months.map(m => m.monthKey);
    for (let i = 0; i < keys.length - 1; i++) {
      // Each key should be 1 month after the next (most recent first)
      const expectedNext = monthKeyAt(new Date(`${keys[i]}-15T12:00:00Z`), 1);
      expect(keys[i + 1]).toBe(expectedNext);
    }
  });

  it('produces the approved status distribution: 1 Negative, 2 Below Cushion, 3 Above Cushion', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    expect(result.countNegative).toBe(1);
    expect(result.countBelowCushion).toBe(2);
    expect(result.countAboveCushion).toBe(3);
  });

  it('M-1 is Below Cushion with the expected cash flows', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    const m1 = result.months[0];
    expect(m1.monthKey).toBe('2026-09');
    expect(m1.cashFlow).toBe(620);
    expect(m1.simulatedCashFlow).toBe(145);
    expect(m1.status).toBe('below-cushion');
  });

  it('M-3 is Negative with the expected cash flows', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    const m3 = result.months[2];
    expect(m3.monthKey).toBe('2026-07');
    expect(m3.cashFlow).toBe(320);
    expect(m3.simulatedCashFlow).toBe(-155);
    expect(m3.status).toBe('negative');
  });

  it('M-4 is Above Cushion with a notably high cash flow (bonus month)', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    const m4 = result.months[3];
    expect(m4.monthKey).toBe('2026-06');
    expect(m4.cashFlow).toBe(1250);
    expect(m4.status).toBe('above-cushion');
  });

  it('M-1 top-3 transactions include the large annual car insurance outflow', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    const m1 = result.months[0];
    const descriptions = m1.topTransactions.map(t => t.description);
    expect(descriptions).toContain('Annual Car Insurance');
  });

  it('M-4 top-3 transactions include the Performance Bonus inflow', () => {
    const h = getDemoHistory(TODAY);
    const result = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, TODAY) as BacktestResult;
    const m4 = result.months[3];
    const descriptions = m4.topTransactions.map(t => t.description);
    expect(descriptions).toContain('Performance Bonus');
  });

  it('works correctly across year boundaries (January today)', () => {
    const jan2026 = new Date('2026-01-15T12:00:00Z');
    const h = getDemoHistory(jan2026);
    const output = runBacktest(h, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, jan2026);
    expect(isIneligible(output)).toBe(false);
    const result = output as BacktestResult;
    expect(result.totalMonths).toBe(6);
    expect(result.months[0].monthKey).toBe('2025-12'); // M-1 = Dec 2025
    expect(result.months[5].monthKey).toBe('2025-07'); // M-6 = Jul 2025
    // Status distribution stays the same regardless of date
    expect(result.countNegative).toBe(1);
    expect(result.countBelowCushion).toBe(2);
    expect(result.countAboveCushion).toBe(3);
  });
});
