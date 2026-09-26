/**
 * API boundary types — server/client contract for the Plaid integration.
 *
 * These types live at the API boundary, separate from the pure financial
 * analysis domain in src/lib/analysis/. The analysis engine has no knowledge
 * of these server-response contracts.
 */

import type { MonthKey, NormalizedTransaction } from '@/lib/analysis/types';

/** Application-owned error classifications returned by Affordly API routes.
 *  Never exposes raw Plaid error codes to the browser. */
export type AffordlyErrorCode =
  | 'no_checking_account'    // No eligible checking account in the Plaid connection
  | 'history_preparing'      // Sandbox history still building; not enough coverage yet
  | 'connection_failed'      // Plaid API error or token exchange failure
  | 'unexpected';            // Catch-all for unanticipated server errors

/** Unified error shape returned by all Affordly API routes on failure */
export interface ApiErrorResponse {
  error: string;             // Non-technical user-facing message
  code: AffordlyErrorCode;
}

/** A checking account option returned to the client for selection */
export interface CheckingAccountOption {
  id: string;
  name: string;
  mask: string;              // last 4 digits, e.g. "4321"
}

/** Normalized account data returned by /api/plaid/connect for each eligible checking account */
export interface PlaidAccountData {
  id: string;
  name: string;
  mask: string;
  transactions: NormalizedTransaction[];
  firstSupportedMonth: MonthKey | null;
}

/** Success shape from POST /api/plaid/connect */
export interface PlaidConnectResponse {
  accounts: PlaidAccountData[];
}

/** Success shape from POST /api/plaid/link-token */
export interface PlaidLinkTokenResponse {
  linkToken: string;
}
