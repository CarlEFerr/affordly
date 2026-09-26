// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { classifyMonth, simulateMonth } from '../../lib/analysis/simulation';
import type { MonthlyAggregation } from '../../lib/analysis/types';

function makeAggregation(cashFlow: number): MonthlyAggregation {
  return {
    monthKey: '2026-03',
    label: 'March 2026',
    cashIn: cashFlow >= 0 ? cashFlow : 0,
    cashOut: cashFlow < 0 ? Math.abs(cashFlow) : 0,
    cashFlow,
    topTransactions: [],
  };
}

// ─── classifyMonth ────────────────────────────────────────────────────────────

describe('classifyMonth — three status cases', () => {
  it('returns negative when simulatedCashFlow < 0', () => {
    expect(classifyMonth(-1, 300)).toBe('negative');
    expect(classifyMonth(-100, 300)).toBe('negative');
    expect(classifyMonth(-0.01, 0)).toBe('negative');
  });

  it('returns below-cushion when simulatedCashFlow >= 0 AND < cushionTarget', () => {
    expect(classifyMonth(100, 300)).toBe('below-cushion');
    expect(classifyMonth(1, 300)).toBe('below-cushion');
    expect(classifyMonth(299, 300)).toBe('below-cushion');
  });

  it('returns above-cushion when simulatedCashFlow >= cushionTarget', () => {
    expect(classifyMonth(300, 300)).toBe('above-cushion'); // exactly equal (inclusive)
    expect(classifyMonth(500, 300)).toBe('above-cushion');
    expect(classifyMonth(301, 300)).toBe('above-cushion');
  });
});

describe('classifyMonth — exact boundary conditions (Reqs 4.6, 4.7, 3.7)', () => {
  // Req 4.6: sim=0, cushion=0 → above-cushion (0 >= 0)
  it('returns above-cushion when simulatedCashFlow=0 and cushionTarget=0', () => {
    expect(classifyMonth(0, 0)).toBe('above-cushion');
  });

  // Req 4.6: sim=0, cushion>0 → below-cushion (0 < cushion)
  it('returns below-cushion when simulatedCashFlow=0 and cushionTarget>0', () => {
    expect(classifyMonth(0, 300)).toBe('below-cushion');
    expect(classifyMonth(0, 1)).toBe('below-cushion');
  });

  // Req 4.7: sim=cushion>0 → above-cushion (boundary is inclusive)
  it('returns above-cushion when simulatedCashFlow exactly equals positive cushionTarget', () => {
    expect(classifyMonth(300, 300)).toBe('above-cushion');
    expect(classifyMonth(1, 1)).toBe('above-cushion');
    expect(classifyMonth(0.01, 0.01)).toBe('above-cushion');
  });

  // Req 3.7: zero cushion makes below-cushion impossible
  it('never returns below-cushion when cushionTarget=0', () => {
    const inputs = [-200, -1, 0, 1, 100, 999];
    for (const v of inputs) {
      const status = classifyMonth(v, 0);
      expect(status).not.toBe('below-cushion');
    }
  });
});

// ─── simulateMonth ────────────────────────────────────────────────────────────

describe('simulateMonth', () => {
  it('subtracts the proposed payment from monthly cash flow', () => {
    const agg = makeAggregation(800);
    const result = simulateMonth(agg, 475, 300);
    expect(result.simulatedCashFlow).toBe(325);
  });

  it('classifies the simulated result correctly', () => {
    expect(simulateMonth(makeAggregation(800), 475, 300).status).toBe('above-cushion');
    // 800 - 475 = 325 >= 300 → above-cushion

    expect(simulateMonth(makeAggregation(620), 475, 300).status).toBe('below-cushion');
    // 620 - 475 = 145; 0 <= 145 < 300 → below-cushion

    expect(simulateMonth(makeAggregation(320), 475, 300).status).toBe('negative');
    // 320 - 475 = -155 < 0 → negative
  });

  it('preserves all original aggregation fields', () => {
    const agg: MonthlyAggregation = {
      monthKey: '2026-06',
      label: 'June 2026',
      cashIn: 5600,
      cashOut: 4350,
      cashFlow: 1250,
      topTransactions: [{ id: 'a', date: '2026-06-01', amount: 4200, description: 'Payroll' }],
    };
    const result = simulateMonth(agg, 475, 300);
    expect(result.monthKey).toBe('2026-06');
    expect(result.label).toBe('June 2026');
    expect(result.cashIn).toBe(5600);
    expect(result.cashOut).toBe(4350);
    expect(result.cashFlow).toBe(1250);
    expect(result.topTransactions).toHaveLength(1);
    expect(result.simulatedCashFlow).toBe(775);
    expect(result.status).toBe('above-cushion');
  });

  it('handles the exact-cushion boundary (simulatedCashFlow = cushionTarget)', () => {
    // 775 - 475 = 300 = cushion → above-cushion (inclusive boundary)
    const result = simulateMonth(makeAggregation(775), 475, 300);
    expect(result.simulatedCashFlow).toBe(300);
    expect(result.status).toBe('above-cushion');
  });
});
