// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { runBacktest, isIneligible } from '../../lib/analysis/index';
import type { FinancialHistory, NormalizedTransaction, BacktestResult } from '../../lib/analysis/types';

// Fixed test date: October 15, 2026 (UTC)
// M-1="2026-09"  M-2="2026-08"  M-3="2026-07"
// M-4="2026-06"  M-5="2026-05"  M-6="2026-04"
const TODAY = new Date('2026-10-15T12:00:00Z');

function tx(id: string, monthKey: string, amount: number): NormalizedTransaction {
  return { id, date: `${monthKey}-15`, amount, description: `tx-${id}` };
}

/**
 * Six-month history matching the approved design document's Demo dataset outcomes.
 * Cash flows (before payment): M-1:+620, M-2:+980, M-3:+320, M-4:+1250, M-5:+710, M-6:+880
 * With payment=$475, cushion=$300:
 *   M-1: 145 → below-cushion
 *   M-2: 505 → above-cushion
 *   M-3: -155 → negative
 *   M-4: 775 → above-cushion
 *   M-5: 235 → below-cushion
 *   M-6: 405 → above-cushion
 */
const SIX_MONTH_HISTORY: FinancialHistory = {
  source: 'demo',
  accountName: 'Test Account',
  firstSupportedMonth: '2026-04', // M-6 → all 6 months supported
  transactions: [
    // M-1 (Sep 2026): cashIn=4200, cashOut=3580, cashFlow=+620
    tx('s1', '2026-09', 4200),
    tx('s2', '2026-09', -1400),
    tx('s3', '2026-09', -1680),
    tx('s4', '2026-09', -500),
    // M-2 (Aug 2026): cashIn=4200, cashOut=3220, cashFlow=+980
    tx('a1', '2026-08', 4200),
    tx('a2', '2026-08', -1400),
    tx('a3', '2026-08', -1820),
    // M-3 (Jul 2026): cashIn=4200, cashOut=3880, cashFlow=+320
    tx('j1', '2026-07', 4200),
    tx('j2', '2026-07', -1400),
    tx('j3', '2026-07', -2480),
    // M-4 (Jun 2026): cashIn=5600 (payroll+bonus), cashOut=4350, cashFlow=+1250
    tx('jn1', '2026-06', 4200),
    tx('jn2', '2026-06', 1400),   // bonus — large inflow for detail test
    tx('jn3', '2026-06', -4350),
    // M-5 (May 2026): cashIn=4200, cashOut=3490, cashFlow=+710
    tx('m1', '2026-05', 4200),
    tx('m2', '2026-05', -3490),
    // M-6 (Apr 2026): cashIn=4200, cashOut=3320, cashFlow=+880
    tx('ap1', '2026-04', 4200),
    tx('ap2', '2026-04', -3320),
  ],
};

// ─── Basic output shape ───────────────────────────────────────────────────────

describe('runBacktest — output shape and ordering', () => {
  it('returns 6 months ordered most-recent-first (M-1 at index 0)', () => {
    const output = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY);
    expect(isIneligible(output)).toBe(false);
    const result = output as BacktestResult;
    expect(result.totalMonths).toBe(6);
    expect(result.months[0].monthKey).toBe('2026-09'); // M-1 first
    expect(result.months[5].monthKey).toBe('2026-04'); // M-6 last
  });

  it('includes the correct period label (oldest – newest)', () => {
    const output = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    expect(output.periodLabel).toBe('April 2026 – September 2026');
  });

  it('carries proposedPayment and cushionTarget in the result', () => {
    const output = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    expect(output.proposedPayment).toBe(475);
    expect(output.cushionTarget).toBe(300);
  });
});

// ─── Cash-flow calculations ───────────────────────────────────────────────────

describe('runBacktest — simulated cash flows', () => {
  it('correctly simulates M-1 (Sep 2026): 620 - 475 = 145', () => {
    const result = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    expect(result.months[0].cashFlow).toBe(620);
    expect(result.months[0].simulatedCashFlow).toBe(145);
  });

  it('correctly simulates M-3 (Jul 2026): 320 - 475 = -155', () => {
    const result = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    expect(result.months[2].cashFlow).toBe(320);
    expect(result.months[2].simulatedCashFlow).toBe(-155);
  });

  it('correctly simulates M-4 (Jun 2026): 1250 - 475 = 775', () => {
    const result = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    expect(result.months[3].cashFlow).toBe(1250);
    expect(result.months[3].simulatedCashFlow).toBe(775);
  });
});

// ─── Status classification ────────────────────────────────────────────────────

describe('runBacktest — status classification (design doc outcomes)', () => {
  it('classifies all 6 months correctly with payment=$475 cushion=$300', () => {
    const result = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    const statuses = result.months.map(m => m.status);
    expect(statuses[0]).toBe('below-cushion');  // Sep: 145 (0 <= 145 < 300)
    expect(statuses[1]).toBe('above-cushion');  // Aug: 505 (>= 300)
    expect(statuses[2]).toBe('negative');       // Jul: -155 (< 0)
    expect(statuses[3]).toBe('above-cushion');  // Jun: 775 (>= 300)
    expect(statuses[4]).toBe('below-cushion');  // May: 235 (0 <= 235 < 300)
    expect(statuses[5]).toBe('above-cushion');  // Apr: 405 (>= 300)
  });

  it('produces correct status counts: negative=1, below=2, above=3', () => {
    const result = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY) as BacktestResult;
    expect(result.countNegative).toBe(1);
    expect(result.countBelowCushion).toBe(2);
    expect(result.countAboveCushion).toBe(3);
  });
});

// ─── Partial-window scenarios ─────────────────────────────────────────────────

describe('runBacktest — partial windows (3–5 months)', () => {
  it('works with exactly 3 supported months', () => {
    const threeMonth: FinancialHistory = {
      ...SIX_MONTH_HISTORY,
      firstSupportedMonth: '2026-07', // M-3 → M-1, M-2, M-3
    };
    const output = runBacktest(threeMonth, 475, 300, TODAY);
    expect(isIneligible(output)).toBe(false);
    const result = output as BacktestResult;
    expect(result.totalMonths).toBe(3);
    expect(result.months[0].monthKey).toBe('2026-09');
    expect(result.months[2].monthKey).toBe('2026-07');
    expect(result.periodLabel).toBe('July 2026 – September 2026');
  });

  it('works with 5 supported months', () => {
    const fiveMonth: FinancialHistory = {
      ...SIX_MONTH_HISTORY,
      firstSupportedMonth: '2026-05', // M-5
    };
    const result = runBacktest(fiveMonth, 475, 300, TODAY) as BacktestResult;
    expect(result.totalMonths).toBe(5);
  });
});

// ─── Ineligible results ───────────────────────────────────────────────────────

describe('runBacktest — ineligible results', () => {
  it('returns ineligible when firstSupportedMonth gives < 3 months', () => {
    const twoMonth: FinancialHistory = {
      ...SIX_MONTH_HISTORY,
      firstSupportedMonth: '2026-08', // only M-1 and M-2
    };
    const output = runBacktest(twoMonth, 475, 300, TODAY);
    expect(isIneligible(output)).toBe(true);
    expect(output).toEqual({ ineligible: true, reason: 'insufficient-history' });
  });

  it('returns ineligible when firstSupportedMonth is null', () => {
    const noHistory: FinancialHistory = {
      ...SIX_MONTH_HISTORY,
      firstSupportedMonth: null,
    };
    const output = runBacktest(noHistory, 475, 300, TODAY);
    expect(isIneligible(output)).toBe(true);
  });

  it('does not throw for insufficient history — returns typed ineligible result', () => {
    const noHistory: FinancialHistory = {
      ...SIX_MONTH_HISTORY,
      firstSupportedMonth: null,
    };
    expect(() => runBacktest(noHistory, 475, 300, TODAY)).not.toThrow();
  });
});

// ─── Source independence ──────────────────────────────────────────────────────

describe('runBacktest — source independence', () => {
  it('produces identical results regardless of source label', () => {
    const demoHistory: FinancialHistory = { ...SIX_MONTH_HISTORY, source: 'demo' };
    const plaidHistory: FinancialHistory = { ...SIX_MONTH_HISTORY, source: 'plaid' };

    const demoResult = runBacktest(demoHistory, 475, 300, TODAY) as BacktestResult;
    const plaidResult = runBacktest(plaidHistory, 475, 300, TODAY) as BacktestResult;

    expect(demoResult.countNegative).toBe(plaidResult.countNegative);
    expect(demoResult.countBelowCushion).toBe(plaidResult.countBelowCushion);
    expect(demoResult.countAboveCushion).toBe(plaidResult.countAboveCushion);
    expect(demoResult.totalMonths).toBe(plaidResult.totalMonths);
    expect(demoResult.months.map(m => m.status)).toEqual(
      plaidResult.months.map(m => m.status)
    );
    expect(demoResult.months.map(m => m.simulatedCashFlow)).toEqual(
      plaidResult.months.map(m => m.simulatedCashFlow)
    );
  });
});

// ─── isIneligible type guard ──────────────────────────────────────────────────

describe('isIneligible', () => {
  it('returns true for an ineligible result', () => {
    const noHistory: FinancialHistory = { ...SIX_MONTH_HISTORY, firstSupportedMonth: null };
    const output = runBacktest(noHistory, 475, 300, TODAY);
    expect(isIneligible(output)).toBe(true);
  });

  it('returns false for a valid BacktestResult', () => {
    const output = runBacktest(SIX_MONTH_HISTORY, 475, 300, TODAY);
    expect(isIneligible(output)).toBe(false);
  });
});
