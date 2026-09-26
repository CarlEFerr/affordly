// @vitest-environment node
import { describe, it, expect, vi, type MockInstance } from 'vitest';
import { applyPageToMap, fetchTransactionSnapshot, TransactionsUpdateStatus } from '../../lib/plaid/sync';
import type { Transaction, RemovedTransaction, PlaidApi } from 'plaid';

// ── applyPageToMap (pure function — no mocks needed) ─────────────────────────

function makeTx(id: string, pending = false): Transaction {
  return {
    transaction_id: id,
    account_id: 'acc1',
    amount: 100,
    pending,
    date: '2026-09-15',
    name: `tx-${id}`,
  } as Transaction;
}

function makeRemoved(id: string): RemovedTransaction {
  return { transaction_id: id, account_id: 'acc1' };
}

describe('applyPageToMap', () => {
  it('adds new transactions to the map', () => {
    const map = new Map<string, Transaction>();
    applyPageToMap(map, [makeTx('a'), makeTx('b')], [], []);
    expect(map.size).toBe(2);
    expect(map.has('a')).toBe(true);
  });

  it('modified replaces the prior representation', () => {
    const map = new Map<string, Transaction>();
    applyPageToMap(map, [makeTx('a')], [], []);
    const updated = { ...makeTx('a'), amount: 999 } as Transaction;
    applyPageToMap(map, [], [updated], []);
    expect(map.get('a')!.amount).toBe(999);
    expect(map.size).toBe(1); // no duplication
  });

  it('removed deletes the transaction by transaction_id', () => {
    const map = new Map<string, Transaction>();
    applyPageToMap(map, [makeTx('a'), makeTx('b')], [], []);
    applyPageToMap(map, [], [], [makeRemoved('a')]);
    expect(map.has('a')).toBe(false);
    expect(map.has('b')).toBe(true);
  });

  it('removes a non-existent key silently (no error)', () => {
    const map = new Map<string, Transaction>();
    expect(() => applyPageToMap(map, [], [], [makeRemoved('ghost')])).not.toThrow();
    expect(map.size).toBe(0);
  });

  it('pending→posted: removed (old pending) + added (new posted) = one posted entry', () => {
    const map = new Map<string, Transaction>();
    // Old pending tx appears in added first (pending: true)
    const pendingTx = makeTx('pending-1', true);
    applyPageToMap(map, [pendingTx], [], []);
    // On a later page: old pending appears in removed, new posted appears in added
    const postedTx = makeTx('posted-1', false);
    applyPageToMap(map, [postedTx], [], [makeRemoved('pending-1')]);
    expect(map.has('pending-1')).toBe(false); // old pending gone
    expect(map.has('posted-1')).toBe(true);   // new posted present
    expect(map.size).toBe(1);
  });

  it('removed and added events on separate pages produce correct final state', () => {
    const map = new Map<string, Transaction>();
    // Page 1: add pending tx
    applyPageToMap(map, [makeTx('p1', true)], [], []);
    // Page 2: remove old pending (separate page)
    applyPageToMap(map, [], [], [makeRemoved('p1')]);
    // Page 3: add new posted
    applyPageToMap(map, [makeTx('posted', false)], [], []);
    expect(map.has('p1')).toBe(false);
    expect(map.has('posted')).toBe(true);
    expect(map.size).toBe(1);
  });

  it('multi-page pagination accumulates all added transactions', () => {
    const map = new Map<string, Transaction>();
    applyPageToMap(map, [makeTx('a'), makeTx('b')], [], []); // page 1
    applyPageToMap(map, [makeTx('c'), makeTx('d')], [], []); // page 2
    expect(map.size).toBe(4);
  });
});

// ── fetchTransactionSnapshot (tests with mocked PlaidApi) ──────────────────

function makeSyncResponse(
  added: Transaction[],
  modified: Transaction[],
  removed: RemovedTransaction[],
  hasMore: boolean,
  status = TransactionsUpdateStatus.HistoricalUpdateComplete,
  nextCursor = 'cursor-next'
) {
  return {
    data: {
      added,
      modified,
      removed,
      has_more: hasMore,
      next_cursor: nextCursor,
      transactions_update_status: status,
    },
  };
}

// Minimal type for the mocked PlaidApi used in these tests
interface MockPlaidApi {
  transactionsSync: MockInstance & ((req: { access_token: string; cursor?: string; count?: number }) => Promise<ReturnType<typeof makeSyncResponse>>);
}

describe('fetchTransactionSnapshot', () => {
  it('paginates until has_more is false and returns all transactions', async () => {
    const mockClient: MockPlaidApi = {
      transactionsSync: vi.fn()
        .mockResolvedValueOnce(makeSyncResponse([makeTx('a'), makeTx('b')], [], [], true, undefined, 'cursor-1'))
        .mockResolvedValueOnce(makeSyncResponse([makeTx('c')], [], [], false)),
    };

    const result = await fetchTransactionSnapshot(mockClient as unknown as PlaidApi, 'access-token-x');
    expect(result.transactions.length).toBe(3);
    expect(mockClient.transactionsSync).toHaveBeenCalledTimes(2);
    // Second call should use the cursor from the first response
    expect(mockClient.transactionsSync.mock.calls[1][0].cursor).toBe('cursor-1');
  });

  it('returns historical update complete status', async () => {
    const mockClient: MockPlaidApi = {
      transactionsSync: vi.fn().mockResolvedValueOnce(
        makeSyncResponse([], [], [], false, TransactionsUpdateStatus.HistoricalUpdateComplete)
      ),
    };
    const result = await fetchTransactionSnapshot(mockClient as unknown as PlaidApi, 'token');
    expect(result.updateStatus).toBe(TransactionsUpdateStatus.HistoricalUpdateComplete);
  });

  it('restarts on TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION', async () => {
    const mutationError = Object.assign(new Error('mutation'), {
      response: { data: { error_code: 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION' } },
    });
    const mockClient: MockPlaidApi = {
      transactionsSync: vi.fn()
        .mockRejectedValueOnce(mutationError)          // first attempt: mutation error
        .mockResolvedValueOnce(                         // second attempt: success
          makeSyncResponse([makeTx('a')], [], [], false)
        ),
    };
    const result = await fetchTransactionSnapshot(mockClient as unknown as PlaidApi, 'token', 3);
    expect(result.transactions.length).toBe(1);
    expect(mockClient.transactionsSync).toHaveBeenCalledTimes(2);
    expect(mockClient.transactionsSync).toHaveBeenCalledTimes(2);
  });

  it('throws after exceeding max restarts from repeated mutations', async () => {
    const mutationError = Object.assign(new Error('mutation'), {
      response: { data: { error_code: 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION' } },
    });
    const mockClient: MockPlaidApi = {
      transactionsSync: vi.fn().mockRejectedValue(mutationError),
    };
    await expect(fetchTransactionSnapshot(mockClient as unknown as PlaidApi, 'token', 2)).rejects.toThrow();
  });
});
