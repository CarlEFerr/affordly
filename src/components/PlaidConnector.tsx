'use client';

/**
 * Plaid Link integration using react-plaid-link@5.0.0.
 *
 * Flow:
 *   1. User clicks "Connect Plaid Sandbox" → fetch link token from /api/plaid/link-token
 *   2. usePlaidLink initializes and becomes ready
 *   3. Link modal opens automatically once ready
 *   4. onSuccess: public_token sent to /api/plaid/connect → normalized account data returned
 *   5. onExit (no error): return to Demo, no error shown
 *   5. onExit (with error): show safe error message
 *
 * Session identity:
 *   A UUID is generated once per browser session and stored in sessionStorage.
 *   It contains no PII and is reused across reconnection attempts in the same tab.
 *
 * Security:
 *   - public_token is a Plaid-issued temporary credential — legitimately in browser
 *   - access_token is created and discarded server-side in /api/plaid/connect
 *   - PLAID_SECRET never reaches the browser
 */

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import Button from '@/components/ui/Button';
import type { ApiErrorResponse, PlaidConnectResponse } from '@/lib/api/types';

interface PlaidConnectorProps {
  /** Called with normalized account data on successful connection */
  onData: (data: PlaidConnectResponse) => void;
  /** Called when Plaid connection fails; receives an ApiErrorResponse */
  onError: (error: Omit<ApiErrorResponse, 'error'> & { error: string }) => void;
  /** Called when the user deliberately cancels Plaid (no error message shown) */
  onCancel: () => void;
}

/** Retrieve or create a session-scoped UUID stored in sessionStorage */
function getOrCreateSessionId(): string {
  const stored = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('affordly-session-id')
    : null;
  if (stored) return stored;
  const id = crypto.randomUUID();
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('affordly-session-id', id);
  }
  return id;
}

export default function PlaidConnector({ onData, onError, onCancel }: PlaidConnectorProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Session UUID: lazy-initialized once, no PII, not persisted beyond browser tab
  const [sessionId] = useState(() => getOrCreateSessionId());

  const handleSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, _meta) => {
      void _meta;
      // public_token may be null per react-plaid-link v5 types — handle defensively
      if (!publicToken) {
        onError({ error: 'Connection failed. Please try again.', code: 'connection_failed' });
        setLinkToken(null);
        return;
      }

      setIsConnecting(true);
      try {
        const res = await fetch('/api/plaid/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicToken }),
        });

        const data: PlaidConnectResponse | ApiErrorResponse = await res.json();

        if (!res.ok) {
          const err = data as ApiErrorResponse;
          onError({ error: err.error, code: err.code });
          return;
        }

        onData(data as PlaidConnectResponse);
      } catch {
        onError({ error: 'Unable to retrieve account data. Please try again or use Demo Data.', code: 'unexpected' });
      } finally {
        setIsConnecting(false);
        setLinkToken(null); // reset for next attempt
      }
    },
    [onData, onError]
  );

  const handleExit: PlaidLinkOnExit = useCallback(
    (error, _meta) => {
      void _meta;
      setLinkToken(null);
      if (error) {
        // Plaid error during Link session — show safe generic message
        onError({
          error: 'The Plaid connection was interrupted. Please try again or use Demo Data.',
          code: 'connection_failed',
        });
      } else {
        // User deliberately closed Link — no error message (Req 11.2)
        onCancel();
      }
    },
    [onError, onCancel]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  // Auto-open Link once the token is fetched and the hook is ready
  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  const handleConnect = useCallback(async () => {
    setIsFetchingToken(true);
    try {
      const res = await fetch('/api/plaid/link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        const err = data as ApiErrorResponse;
        onError({ error: err.error, code: err.code });
        return;
      }

      setLinkToken(data.linkToken);
    } catch {
      onError({
        error: 'Unable to start the Plaid connection. Please try again.',
        code: 'connection_failed',
      });
    } finally {
      setIsFetchingToken(false);
    }
  }, [sessionId, onError]);

  const isLoading = isFetchingToken || isConnecting || (!!linkToken && !ready);

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      aria-label="Connect Plaid Sandbox"
    >
      {isLoading ? 'Connecting…' : 'Connect Plaid Sandbox'}
    </Button>
  );
}
