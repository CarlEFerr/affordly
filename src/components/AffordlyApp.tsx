'use client';

/**
 * Root client component — owns all application state.
 *
 * State machine (plaidStatus):
 *   idle → (connect) → loading → selecting-account | ready | error
 *
 * Payment and cushion are preserved when switching between Demo and Plaid data.
 * The question being tested stays the same; only the historical source changes.
 */
import { useState, useMemo } from 'react';
import { runBacktest, isIneligible } from '@/lib/analysis/index';
import { getDemoHistory } from '@/lib/adapters/demo';
import { DEMO_DEFAULT_PAYMENT, DEMO_DEFAULT_CUSHION } from '@/lib/demo/dataset';
import type { FinancialHistory, BacktestResult } from '@/lib/analysis/types';
import type { ApiErrorResponse, PlaidConnectResponse, PlaidAccountData } from '@/lib/api/types';

import DataModeBar from '@/components/DataModeBar';
import InputPanel from '@/components/InputPanel';
import Disclosure from '@/components/Disclosure';
import BacktestSummary from '@/components/BacktestSummary';
import MonthCardList from '@/components/MonthCardList';
import AccountSelector from '@/components/AccountSelector';
import Spinner from '@/components/ui/Spinner';

type PlaidStatus = 'idle' | 'loading' | 'selecting-account' | 'ready' | 'error';

export default function AffordlyApp() {
  // Financial history — starts as Demo
  const [dataMode, setDataMode] = useState<'demo' | 'plaid'>('demo');
  const [financialHistory, setFinancialHistory] = useState<FinancialHistory>(
    () => getDemoHistory()
  );

  // Plaid connection state
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatus>('idle');
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [accountOptions, setAccountOptions] = useState<PlaidAccountData[] | null>(null);

  // User inputs — preserved when switching modes
  const [proposedPayment, setProposedPayment] = useState<number | null>(DEMO_DEFAULT_PAYMENT);
  const [cushionTarget, setCushionTarget] = useState<number | null>(DEMO_DEFAULT_CUSHION);
  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);

  // Derived backtest — recalculates on any input change
  const backtestResult = useMemo((): BacktestResult | null => {
    if (proposedPayment === null || cushionTarget === null) return null;
    const output = runBacktest(financialHistory, proposedPayment, cushionTarget);
    return isIneligible(output) ? null : output;
  }, [financialHistory, proposedPayment, cushionTarget]);

  // Separate check for insufficient history (ineligible but not null inputs)
  const isInsufficientHistory = useMemo(() => {
    if (proposedPayment === null || cushionTarget === null) return false;
    const output = runBacktest(financialHistory, proposedPayment, cushionTarget);
    return isIneligible(output);
  }, [financialHistory, proposedPayment, cushionTarget]);

  // ── Plaid handlers ────────────────────────────────────────────────────────

  const handlePlaidData = (data: PlaidConnectResponse) => {
    if (data.accounts.length === 0) {
      setPlaidError('No checking account found in this connection.');
      setPlaidStatus('error');
      return;
    }
    if (data.accounts.length === 1) {
      // Auto-select the only account
      activatePlaidAccount(data.accounts[0]);
    } else {
      // Multiple accounts — show inline selector
      setAccountOptions(data.accounts);
      setPlaidStatus('selecting-account');
    }
  };

  const handlePlaidError = (error: Omit<ApiErrorResponse, 'error'> & { error: string }) => {
    setPlaidError(error.error);
    setPlaidStatus('error');
  };

  const handlePlaidCancel = () => {
    // User deliberately closed Link — return to Demo, no error (Req 11.2)
    setPlaidStatus('idle');
    setPlaidError(null);
  };

  const activatePlaidAccount = (account: PlaidAccountData) => {
    const history: FinancialHistory = {
      source: 'plaid',
      accountName: account.name,
      transactions: account.transactions,
      firstSupportedMonth: account.firstSupportedMonth,
    };
    setFinancialHistory(history);
    setDataMode('plaid');
    setPlaidStatus('ready');
    setAccountOptions(null);
    setExpandedMonthKey(null);
  };

  const handleAccountSelect = (account: PlaidAccountData) => {
    activatePlaidAccount(account);
  };

  const switchToDemo = () => {
    setFinancialHistory(getDemoHistory());
    setDataMode('demo');
    setPlaidStatus('idle');
    setPlaidError(null);
    setAccountOptions(null);
    setExpandedMonthKey(null);
    // Payment and cushion are preserved
  };

  const handleToggleMonth = (monthKey: string) => {
    setExpandedMonthKey(prev => (prev === monthKey ? null : monthKey));
  };

  const inputsReady = proposedPayment !== null && cushionTarget !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-(--color-page-bg)">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">

        {/* ── Header ──────────────────────────────────────────── */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-(--color-text-primary) mb-1">
            Affordly
          </h1>
          <p className="text-sm text-(--color-text-secondary) leading-relaxed">
            How would a monthly payment have fit into the financial months you just lived through?
          </p>
        </header>

        {/* ── Data mode bar ───────────────────────────────────── */}
        <div className="mb-6">
          <DataModeBar
            mode={dataMode}
            accountName={financialHistory.accountName}
            onPlaidData={handlePlaidData}
            onPlaidError={handlePlaidError}
            onPlaidCancel={handlePlaidCancel}
            onUseDemo={switchToDemo}
          />
        </div>

        {/* ── Plaid loading state ─────────────────────────────── */}
        {plaidStatus === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="flex justify-center py-8"
          >
            <Spinner label="Connecting to Plaid Sandbox…" />
          </div>
        )}

        {/* ── Plaid error state ───────────────────────────────── */}
        {plaidStatus === 'error' && plaidError && (
          <div
            role="alert"
            className="rounded-lg border border-(--color-status-negative-border) bg-(--color-status-negative-surface) px-4 py-3 mb-6"
          >
            <p className="text-sm text-(--color-status-negative-text)">{plaidError}</p>
            <button
              type="button"
              onClick={switchToDemo}
              className="mt-2 text-sm font-medium text-(--color-text-primary) underline"
            >
              Use Demo Data instead
            </button>
          </div>
        )}

        {/* ── Account selector (multiple checking accounts) ───── */}
        {plaidStatus === 'selecting-account' && accountOptions && (
          <div className="mb-6">
            <AccountSelector
              accounts={accountOptions}
              onSelect={handleAccountSelect}
              onUseDemo={switchToDemo}
            />
          </div>
        )}

        {/* ── Show Demo/Plaid content when not in Plaid transition ─ */}
        {plaidStatus !== 'loading' && plaidStatus !== 'selecting-account' && (
          <>
            {/* ── Inputs ──────────────────────────────────────── */}
            <section aria-label="Payment details" className="mb-6">
              <InputPanel
                defaultPayment={DEMO_DEFAULT_PAYMENT}
                defaultCushion={DEMO_DEFAULT_CUSHION}
                onPaymentChange={setProposedPayment}
                onCushionChange={setCushionTarget}
              />
            </section>

            {/* ── Disclosure ──────────────────────────────────── */}
            <div className="mb-6">
              <Disclosure />
            </div>

            {/* ── Insufficient history state ──────────────────── */}
            {inputsReady && isInsufficientHistory && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-6 text-center mb-6"
              >
                <p className="text-sm text-(--color-text-secondary)">
                  This account needs at least 3 complete months of transaction history
                  for a backtest.
                </p>
                <button
                  type="button"
                  onClick={switchToDemo}
                  className="mt-2 text-sm font-medium text-(--color-text-primary) underline"
                >
                  Use Demo Data instead
                </button>
              </div>
            )}

            {/* ── Results ─────────────────────────────────────── */}
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
              !isInsufficientHistory && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-8 text-center"
                >
                  <p className="text-sm text-(--color-text-secondary)">
                    Enter a payment amount and cushion target to see the backtest.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
