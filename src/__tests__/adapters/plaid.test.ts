// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  normalizePlaidTransaction,
  normalizePlaidTransactions,
  derivePlaidFirstSupportedMonth,
  buildPlaidHistory,
} from '../../lib/adapters/plaid';
import { runBacktest, isIneligible } from '../../lib/analysis/index';
import { getDemoHistory } from '../../lib/adapters/demo';
import { DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION } from '../../lib/demo/dataset';
import type { Transaction } from 'plaid';

function makeTx(id: string, opts: {
  accountId?: string;
  amount?: number;
  pending?: boolean;
  merchantName?: string | null;
  name?: string;
  date?: string;
} = {}): Transaction {
  return {
    transaction_id: id,
    account_id: opts.accountId ?? 'acc1',
    amount: opts.amount ?? 100,
    pending: opts.pending ?? false,
    date: opts.date ?? '2026-09-15',
    merchant_name: opts.merchantName ?? null,
    name: opts.name ?? `tx-${id}`,
  } as Transaction;
}

// ── normalizePlaidTransaction ────────────────────────────────────────────────

describe('normalizePlaidTransaction — sign convention', () => {
  it('flips a Plaid debit (positive) to Affordly outflow (negative)', () => {
    const t = makeTx('1', { amount: 75.5 });
    expect(normalizePlaidTransaction(t).amount).toBe(-75.5);
  });

  it('flips a Plaid credit (negative) to Affordly inflow (positive)', () => {
    const t = makeTx('2', { amount: -3000 });
    expect(normalizePlaidTransaction(t).amount).toBe(3000);
  });

  it('uses merchant_name when available', () => {
    const t = makeTx('3', { merchantName: 'Whole Foods', name: 'WFM 12345' });
    expect(normalizePlaidTransaction(t).description).toBe('Whole Foods');
  });

  it('falls back to name when merchant_name is null', () => {
    const t = makeTx('4', { merchantName: null, name: 'ACH Deposit' });
    expect(normalizePlaidTransaction(t).description).toBe('ACH Deposit');
  });

  it('preserves transaction_id as id', () => {
    const t = makeTx('abc-123');
    expect(normalizePlaidTransaction(t).id).toBe('abc-123');
  });

  it('preserves date as-is', () => {
    const t = makeTx('1', { date: '2026-06-15' });
    expect(normalizePlaidTransaction(t).date).toBe('2026-06-15');
  });
});

// ── normalizePlaidTransactions (filtering) ───────────────────────────────────

describe('normalizePlaidTransactions', () => {
  it('excludes pending transactions', () => {
    const txs = [makeTx('a', { pending: false }), makeTx('b', { pending: true })];
    const result = normalizePlaidTransactions(txs, 'acc1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('filters to the specified accountId only', () => {
    const txs = [
      makeTx('a', { accountId: 'acc1' }),
      makeTx('b', { accountId: 'acc2' }),
    ];
    const result = normalizePlaidTransactions(txs, 'acc1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('applies the sign flip to all returned transactions', () => {
    const txs = [makeTx('a', { amount: 500 })];
    const result = normalizePlaidTransactions(txs, 'acc1');
    expect(result[0].amount).toBe(-500);
  });

  it('returns empty array when all transactions are pending', () => {
    const txs = [makeTx('a', { pending: true }), makeTx('b', { pending: true })];
    expect(normalizePlaidTransactions(txs, 'acc1')).toHaveLength(0);
  });

  it('returns empty array when no transactions match accountId', () => {
    const txs = [makeTx('a', { accountId: 'different' })];
    expect(normalizePlaidTransactions(txs, 'acc1')).toHaveLength(0);
  });
});

// ── derivePlaidFirstSupportedMonth ───────────────────────────────────────────

describe('derivePlaidFirstSupportedMonth', () => {
  it('returns null for empty transaction array', () => {
    expect(derivePlaidFirstSupportedMonth([])).toBeNull();
  });

  it('returns the month AFTER the earliest transaction month', () => {
    // Earliest transaction in March → boundary = March → firstSupported = April
    const txs = [
      { id: '1', date: '2026-03-18', amount: -100, description: 'a' },
      { id: '2', date: '2026-05-01', amount: 200, description: 'b' },
    ];
    expect(derivePlaidFirstSupportedMonth(txs)).toBe('2026-04');
  });

  it('handles December boundary → January of next year', () => {
    const txs = [{ id: '1', date: '2025-12-15', amount: -50, description: 'x' }];
    expect(derivePlaidFirstSupportedMonth(txs)).toBe('2026-01');
  });

  it('uses earliest date regardless of array order', () => {
    const txs = [
      { id: '1', date: '2026-08-10', amount: 100, description: 'a' },
      { id: '2', date: '2026-03-05', amount: -50, description: 'b' }, // earliest
      { id: '3', date: '2026-06-20', amount: 200, description: 'c' },
    ];
    expect(derivePlaidFirstSupportedMonth(txs)).toBe('2026-04');
  });
});

// ── buildPlaidHistory ────────────────────────────────────────────────────────

describe('buildPlaidHistory', () => {
  it('returns source = plaid', () => {
    const h = buildPlaidHistory([], 'acc1', 'Test Account');
    expect(h.source).toBe('plaid');
  });

  it('sets account name', () => {
    const h = buildPlaidHistory([], 'acc1', 'Checking Account');
    expect(h.accountName).toBe('Checking Account');
  });

  it('sets firstSupportedMonth = null when no posted transactions', () => {
    const h = buildPlaidHistory([], 'acc1', 'Account');
    expect(h.firstSupportedMonth).toBeNull();
  });

  it('derives firstSupportedMonth from the earliest posted transaction', () => {
    const txs = [makeTx('a', { date: '2026-03-10', pending: false, amount: -200 })];
    const h = buildPlaidHistory(txs, 'acc1', 'Account');
    expect(h.firstSupportedMonth).toBe('2026-04'); // month AFTER March
  });

  it('produces the same analysis result as Demo for identical cash flows', () => {
    // Source independence: same transactions → same backtest regardless of source
    const today = new Date('2026-10-15T12:00:00Z');
    const demoHistory = getDemoHistory(today);

    // Build a plaid history with the exact same transactions and firstSupportedMonth
    const plaidHistory = { ...demoHistory, source: 'plaid' as const };

    const demoResult = runBacktest(demoHistory, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, today);
    const plaidResult = runBacktest(plaidHistory, DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION, today);

    expect(isIneligible(demoResult)).toBe(false);
    expect(isIneligible(plaidResult)).toBe(false);

    if (!isIneligible(demoResult) && !isIneligible(plaidResult)) {
      expect(demoResult.countNegative).toBe(plaidResult.countNegative);
      expect(demoResult.countBelowCushion).toBe(plaidResult.countBelowCushion);
      expect(demoResult.countAboveCushion).toBe(plaidResult.countAboveCushion);
      expect(demoResult.months.map(m => m.status)).toEqual(
        plaidResult.months.map(m => m.status)
      );
    }
  });
});
