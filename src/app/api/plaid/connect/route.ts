/**
 * POST /api/plaid/connect
 *
 * Exchanges the public_token from Plaid Link for an access token, fetches
 * accounts and transactions, normalizes to FinancialHistory, and returns
 * the result to the client.
 *
 * Security:
 *   - public_token arrives from the browser (intended — standard Plaid Link flow)
 *   - access_token is created here and NEVER returned to the client
 *   - access_token is discarded when the handler returns (no persistence)
 *   - Plaid raw errors are logged server-side only
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccountType, AccountSubtype, TransactionsUpdateStatus } from 'plaid';
import { createPlaidClient } from '@/lib/plaid/client';
import { fetchTransactionSnapshot } from '@/lib/plaid/sync';
import { buildPlaidHistory, derivePlaidFirstSupportedMonth } from '@/lib/adapters/plaid';
import { selectCompleteMonths } from '@/lib/analysis/months';
import type { ApiErrorResponse, PlaidConnectResponse } from '@/lib/api/types';

// Bounded readiness retry constants (provisional — validate against actual Sandbox behavior)
const READINESS_RETRIES = 3;
const READINESS_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Invalid request.', code: 'unexpected' },
      { status: 400 }
    );
  }

  const { publicToken } = body as { publicToken?: unknown };

  if (typeof publicToken !== 'string' || !publicToken) {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Invalid connection token.', code: 'connection_failed' },
      { status: 400 }
    );
  }

  try {
    const client = createPlaidClient();

    // 1. Exchange public_token → access_token (server-side only; never returned to client)
    const exchangeResp = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchangeResp.data.access_token;
    // accessToken exists only in this function scope — not stored anywhere

    // 2. Fetch accounts and filter to eligible checking accounts
    const accountsResp = await client.accountsGet({ access_token: accessToken });
    const checkingAccounts = accountsResp.data.accounts.filter(
      a => a.type === AccountType.Depository && a.subtype === AccountSubtype.Checking
    );

    if (checkingAccounts.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'No checking account found in this Plaid Sandbox connection. Try a different connection or use Demo Data.',
          code: 'no_checking_account',
        },
        { status: 422 }
      );
    }

    // 3. Fetch transaction snapshot with bounded readiness retry
    let snapshot = await fetchTransactionSnapshot(client, accessToken);
    let readinessAttempts = 0;

    // Determine coverage from the current snapshot
    const hasSufficientCoverage = (reconciledTransactions: typeof snapshot.transactions) => {
      const posted = reconciledTransactions.filter(t => !t.pending);
      const history = {
        source: 'plaid' as const,
        accountName: '',
        transactions: posted.flatMap(t => [{ id: t.transaction_id, date: t.date, amount: -(t.amount), description: t.merchant_name ?? t.name }]),
        firstSupportedMonth: derivePlaidFirstSupportedMonth(
          posted.map(t => ({
            id: t.transaction_id,
            date: t.date,
            amount: -(t.amount),
            description: t.merchant_name ?? t.name,
          }))
        ),
      };
      const result = selectCompleteMonths(history);
      return !('ineligible' in result);
    };

    // Case A: history not complete AND insufficient coverage → retry
    while (
      snapshot.updateStatus !== TransactionsUpdateStatus.HistoricalUpdateComplete &&
      !hasSufficientCoverage(snapshot.transactions) &&
      readinessAttempts < READINESS_RETRIES
    ) {
      await sleep(READINESS_DELAY_MS);
      snapshot = await fetchTransactionSnapshot(client, accessToken);
      readinessAttempts++;
    }

    // After retries: check final state
    if (
      snapshot.updateStatus !== TransactionsUpdateStatus.HistoricalUpdateComplete &&
      !hasSufficientCoverage(snapshot.transactions)
    ) {
      // Case A final: still insufficient after all retries → history_preparing
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Sandbox transaction history is still being prepared. Try connecting again in a moment, or use Demo Data.',
          code: 'history_preparing',
        },
        { status: 503 }
      );
    }
    // Case B: not complete but has ≥3 months → proceed with partial window (handled below)
    // Case C: complete with insufficient months → return data; client analysis engine handles ineligible

    // 4. Build normalized account data for each eligible checking account
    const reconciledTransactions = snapshot.transactions;

    const accounts = checkingAccounts.map(account => {
      const history = buildPlaidHistory(
        reconciledTransactions,
        account.account_id,
        account.name
      );
      return {
        id: account.account_id,
        name: account.name,
        mask: account.mask ?? '????',
        transactions: history.transactions,
        firstSupportedMonth: history.firstSupportedMonth,
      };
    });

    // accessToken goes out of scope here — no persistence
    return NextResponse.json<PlaidConnectResponse>({ accounts });

  } catch (error: unknown) {
    console.error('[/api/plaid/connect] Error:', (error as Error)?.message);

    return NextResponse.json<ApiErrorResponse>(
      { error: 'Unable to retrieve account data. Please try again or use Demo Data.', code: 'connection_failed' },
      { status: 502 }
    );
  }
}
