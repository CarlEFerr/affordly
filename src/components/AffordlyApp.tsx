'use client';

/**
 * Root client component — owns all application state.
 * Delegates all rendering to specialized sub-components.
 *
 * State:
 *   - financialHistory: the current FinancialHistory (Demo for this checkpoint)
 *   - proposedPayment: committed numeric payment value (null = invalid/empty)
 *   - cushionTarget:   committed numeric cushion value (null = invalid/empty)
 *   - expandedMonthKey: which month card is currently expanded
 *
 * backtestResult is DERIVED via useMemo — recalculates any time inputs change.
 */
import { useState, useMemo } from 'react';
import { runBacktest, isIneligible } from '@/lib/analysis/index';
import { getDemoHistory } from '@/lib/adapters/demo';
import { DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION } from '@/lib/demo/dataset';
import type { BacktestResult } from '@/lib/analysis/types';

import DataModeBar from '@/components/DataModeBar';
import InputPanel from '@/components/InputPanel';
import Disclosure from '@/components/Disclosure';
import BacktestSummary from '@/components/BacktestSummary';
import MonthCardList from '@/components/MonthCardList';

export default function AffordlyApp() {
  // Demo history — produced once at mount; Plaid path added in Task 7
  const [financialHistory] = useState(() => getDemoHistory());
  const [proposedPayment, setProposedPayment] = useState<number | null>(DEMO_DEFAULT_PAYMENT);
  const [cushionTarget, setCushionTarget] = useState<number | null>(DEMO_DEFAULT_CUSHION);
  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);

  // Derived backtest — recalculates on any input change (never stale)
  const backtestResult = useMemo((): BacktestResult | null => {
    if (proposedPayment === null || cushionTarget === null) return null;
    const output = runBacktest(financialHistory, proposedPayment, cushionTarget);
    return isIneligible(output) ? null : output;
  }, [financialHistory, proposedPayment, cushionTarget]);

  const handleToggleMonth = (monthKey: string) => {
    setExpandedMonthKey(prev => (prev === monthKey ? null : monthKey));
  };

  const inputsReady = proposedPayment !== null && cushionTarget !== null;

  return (
    <div className="min-h-screen bg-(--color-page-bg)">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-(--color-text-primary) mb-1">
            Affordly
          </h1>
          <p className="text-sm text-(--color-text-secondary) leading-relaxed">
            How would a monthly payment have fit into the financial months you just lived through?
          </p>
        </header>

        {/* ── Data mode indicator ─────────────────────────────────── */}
        <div className="mb-6">
          <DataModeBar
            mode="demo"
            accountName={financialHistory.accountName}
          />
        </div>

        {/* ── Inputs ─────────────────────────────────────────────── */}
        <section aria-label="Payment details" className="mb-6">
          <InputPanel
            defaultPayment={DEMO_DEFAULT_PAYMENT}
            defaultCushion={DEMO_DEFAULT_CUSHION}
            onPaymentChange={setProposedPayment}
            onCushionChange={setCushionTarget}
          />
        </section>

        {/* ── Disclosure ──────────────────────────────────────────── */}
        <div className="mb-6">
          <Disclosure />
        </div>

        {/* ── Results ────────────────────────────────────────────── */}
        {inputsReady && backtestResult ? (
          <main aria-label="Backtest results" className="flex flex-col gap-6">
            <BacktestSummary result={backtestResult} />
            <MonthCardList
              result={backtestResult}
              expandedMonthKey={expandedMonthKey}
              onToggleMonth={handleToggleMonth}
            />
          </main>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-8 text-center"
          >
            <p className="text-sm text-(--color-text-secondary)">
              Enter a payment amount and cushion target to see the backtest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
