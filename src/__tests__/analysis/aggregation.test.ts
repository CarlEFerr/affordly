// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { aggregateMonth } from '../../lib/analysis/aggregation';
import type { NormalizedTransaction } from '../../lib/analysis/types';

function tx(id: string, date: string, amount: number): NormalizedTransaction {
  return { id, date, amount, description: `desc-${id}` };
}

// ─── Basic aggregation ────────────────────────────────────────────────────────

describe('aggregateMonth — basic aggregation', () => {
  it('calculates cashIn, cashOut, and cashFlow for a typical month', () => {
    const transactions = [
      tx('1', '2026-03-15', 4200),   // inflow
      tx('2', '2026-03-01', -1400),  // outflow
      tx('3', '2026-03-05', -300),   // outflow
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.cashIn).toBe(4200);
    expect(result.cashOut).toBe(1700);
    expect(result.cashFlow).toBe(2500);
  });

  it('sets the correct monthKey and label', () => {
    const result = aggregateMonth([], '2026-09');
    expect(result.monthKey).toBe('2026-09');
    expect(result.label).toBe('September 2026');
  });

  it('only includes transactions whose date matches the month key', () => {
    const transactions = [
      tx('1', '2026-03-15', 1000),
      tx('2', '2026-04-01', 500),  // different month — must be excluded
      tx('3', '2026-02-28', 200),  // different month — must be excluded
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.cashIn).toBe(1000);
    expect(result.cashOut).toBe(0);
    expect(result.topTransactions).toHaveLength(1);
  });
});

// ─── Zero-transaction month ───────────────────────────────────────────────────

describe('aggregateMonth — zero transactions', () => {
  it('returns zeros and an empty topTransactions for a month with no transactions', () => {
    const result = aggregateMonth([], '2026-05');
    expect(result.cashIn).toBe(0);
    expect(result.cashOut).toBe(0);
    expect(result.cashFlow).toBe(0);
    expect(result.topTransactions).toEqual([]);
  });

  it('returns zeros when the transaction list has entries for other months only', () => {
    const transactions = [tx('1', '2026-04-10', 500), tx('2', '2026-06-20', -200)];
    const result = aggregateMonth(transactions, '2026-05');
    expect(result.cashFlow).toBe(0);
    expect(result.topTransactions).toHaveLength(0);
  });
});

// ─── Zero inflow / zero outflow ───────────────────────────────────────────────

describe('aggregateMonth — zero inflow or zero outflow', () => {
  it('handles a month with only outflows (zero inflow)', () => {
    const transactions = [
      tx('1', '2026-03-10', -500),
      tx('2', '2026-03-20', -200),
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.cashIn).toBe(0);
    expect(result.cashOut).toBe(700);
    expect(result.cashFlow).toBe(-700);
  });

  it('handles a month with only inflows (zero outflow)', () => {
    const transactions = [
      tx('1', '2026-03-01', 3000),
      tx('2', '2026-03-15', 500),
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.cashIn).toBe(3500);
    expect(result.cashOut).toBe(0);
    expect(result.cashFlow).toBe(3500);
  });
});

// ─── Top-3 transactions ───────────────────────────────────────────────────────

describe('aggregateMonth — top-3 transactions', () => {
  it('returns the 3 largest by |amount|, bidirectional', () => {
    const transactions = [
      tx('1', '2026-03-01', 3200),    // +3200 → rank 1
      tx('2', '2026-03-05', -1400),   // -1400 → rank 3
      tx('3', '2026-03-10', -1680),   // -1680 → rank 2
      tx('4', '2026-03-15', -180),    // -180  → rank 4 (excluded)
      tx('5', '2026-03-20', -100),    // -100  → rank 5 (excluded)
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.topTransactions).toHaveLength(3);
    expect(result.topTransactions[0].id).toBe('1'); // |3200|
    expect(result.topTransactions[1].id).toBe('3'); // |1680|
    expect(result.topTransactions[2].id).toBe('2'); // |1400|
  });

  it('large inflow competes with outflows for top-3 slots', () => {
    const transactions = [
      tx('a', '2026-03-01', -500),
      tx('b', '2026-03-10', -400),
      tx('c', '2026-03-15', -300),
      tx('d', '2026-03-20', 1000),  // large inflow — must rank 1
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.topTransactions[0].id).toBe('d'); // |1000| is largest
    expect(result.topTransactions).toHaveLength(3);
  });

  it('returns all transactions when fewer than 3 exist', () => {
    const transactions = [
      tx('1', '2026-03-01', 500),
      tx('2', '2026-03-15', -200),
    ];
    const result = aggregateMonth(transactions, '2026-03');
    expect(result.topTransactions).toHaveLength(2);
  });

  it('returns the single transaction when only one exists', () => {
    const result = aggregateMonth([tx('1', '2026-03-10', 1000)], '2026-03');
    expect(result.topTransactions).toHaveLength(1);
    expect(result.topTransactions[0].id).toBe('1');
  });
});
