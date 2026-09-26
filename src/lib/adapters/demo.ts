/**
 * Demo Mode source adapter.
 *
 * Converts the deterministic demo dataset into a FinancialHistory ready for the
 * analysis engine. Sets firstSupportedMonth = M−6, guaranteeing all six months
 * participate in the backtest — no coverage inference needed.
 */

import type { FinancialHistory, NormalizedTransaction } from '../analysis/types';
import { monthKeyAt } from '../utils/date';
import { MONTH_CONFIGS } from '../demo/dataset';

/**
 * Returns a normalized FinancialHistory for Demo Mode.
 *
 * @param today - injectable for deterministic tests (default: new Date())
 */
export function getDemoHistory(today: Date = new Date()): FinancialHistory {
  const transactions: NormalizedTransaction[] = [];

  // MONTH_CONFIGS is ordered M-1 first (index 0) through M-6 (index 5)
  MONTH_CONFIGS.forEach((config, index) => {
    const monthOffset = index + 1; // 1=M-1, 2=M-2, ... 6=M-6
    const monthKey = monthKeyAt(today, monthOffset); // "YYYY-MM"

    config.transactions.forEach(txConfig => {
      const day = String(txConfig.dayOfMonth).padStart(2, '0');
      transactions.push({
        id: txConfig.id,
        date: `${monthKey}-${day}`,
        amount: txConfig.amount,
        description: txConfig.description,
      });
    });
  });

  return {
    source: 'demo',
    accountName: 'Demo Checking Account',
    transactions,
    firstSupportedMonth: monthKeyAt(today, 6), // M−6: all six months are supported
  };
}
