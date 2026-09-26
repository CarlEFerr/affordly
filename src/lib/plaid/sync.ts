/**
 * Plaid /transactions/sync reconciliation helper.
 *
 * Extracted as a testable pure helper to keep the API route handler focused.
 * All pagination and map reconciliation logic lives here.
 *
 * Pending→posted lifecycle (per Plaid documentation):
 *   - The old pending transaction appears in `removed`
 *   - The new posted transaction appears in `added` (possibly on a different page)
 *   - The reconciliation map handles this naturally: remove deletes the pending entry;
 *     add inserts the posted entry. No special handling needed.
 */

import type { PlaidApi } from 'plaid';
import { TransactionsUpdateStatus } from 'plaid';
import type { Transaction, RemovedTransaction } from 'plaid';

export { TransactionsUpdateStatus };

/** Result of a complete paginated sync operation */
export interface SyncSnapshot {
  transactions: Transaction[];
  updateStatus: TransactionsUpdateStatus;
}

/**
 * Applies one page of sync updates to the running reconciliation map.
 * Pure function — extracted for unit testing without mocking PlaidApi.
 *
 * Note: RemovedTransaction.transaction_id is the field name in the SDK
 * (the design.md pseudocode used removed_transaction_id — minor naming difference).
 */
export function applyPageToMap(
  map: Map<string, Transaction>,
  added: Transaction[],
  modified: Transaction[],
  removed: RemovedTransaction[]
): void {
  for (const t of added) map.set(t.transaction_id, t);
  for (const t of modified) map.set(t.transaction_id, t);
  for (const r of removed) map.delete(r.transaction_id); // correct field per SDK
}

/** Checks whether a caught error is a specific Plaid API error code */
function isPlaidErrorCode(error: unknown, code: string): boolean {
  if (!(error instanceof Error)) return false;
  const resp = (error as { response?: { data?: { error_code?: string } } }).response;
  return resp?.data?.error_code === code;
}

const MUTATION_ERROR = 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION';

/**
 * Fetches the complete transaction snapshot for an Item via /transactions/sync.
 *
 * Paginates until has_more === false, applying added/modified/removed to a Map
 * keyed by transaction_id. Restarts the full pagination loop if a
 * TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION error occurs.
 *
 * @param client     - Configured PlaidApi instance
 * @param accessToken - Plaid Item access token (server-side only)
 * @param maxRestarts - Maximum full-loop restarts on mutation errors (default: 3)
 */
export async function fetchTransactionSnapshot(
  client: PlaidApi,
  accessToken: string,
  maxRestarts = 3
): Promise<SyncSnapshot> {
  let restarts = 0;

  while (true) {
    // Build the complete reconciliation map from the initial cursor (no cursor = full history)
    const map = new Map<string, Transaction>();
    let cursor: string | undefined = undefined;
    let updateStatus: TransactionsUpdateStatus =
      TransactionsUpdateStatus.TransactionsUpdateStatusUnknown;
    let mutationDuringPagination = false;

    try {
      let hasMore = true;
      while (hasMore) {
        const response = await client.transactionsSync({
          access_token: accessToken,
          ...(cursor ? { cursor } : {}),
          count: 500, // maximize page size to minimize round-trips
        });

        const data = response.data;
        applyPageToMap(map, data.added, data.modified, data.removed);
        updateStatus = data.transactions_update_status;
        hasMore = data.has_more;
        cursor = data.next_cursor || undefined;
      }
    } catch (error: unknown) {
      if (isPlaidErrorCode(error, MUTATION_ERROR)) {
        mutationDuringPagination = true;
      } else {
        // Re-throw non-mutation errors to the caller
        throw error;
      }
    }

    if (mutationDuringPagination) {
      if (restarts >= maxRestarts) {
        // Exhausted restart budget — surface as a connection failure
        throw new Error(`Sync mutation during pagination after ${maxRestarts} restart attempts.`);
      }
      restarts++;
      // Discard the partial map and restart from the initial cursor (no cursor)
      continue;
    }

    return {
      transactions: Array.from(map.values()),
      updateStatus,
    };
  }
}
