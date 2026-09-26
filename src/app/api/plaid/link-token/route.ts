/**
 * POST /api/plaid/link-token
 *
 * Creates a Plaid Link token for the client to initialize Plaid Link.
 * Uses the client-supplied session UUID as the Plaid user identifier.
 *
 * Security:
 *   - PLAID_SECRET is read from server-side env only, never returned to client
 *   - sessionId is validated as a UUID-shaped non-PII identifier
 *   - Raw Plaid errors are logged server-side, not forwarded to browser
 */

import { NextRequest, NextResponse } from 'next/server';
import { Products, CountryCode, type LinkTokenCreateRequest } from 'plaid';
import { createPlaidClient } from '@/lib/plaid/client';
import type { ApiErrorResponse, PlaidLinkTokenResponse } from '@/lib/api/types';

/** Validates a UUID v4 shaped string (non-PII, bounded length, expected format) */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Invalid request.', code: 'unexpected' },
      { status: 400 }
    );
  }

  const { sessionId } = body as { sessionId?: unknown };

  if (!isValidSessionId(sessionId)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Invalid session identifier.', code: 'unexpected' },
      { status: 400 }
    );
  }

  // Create Plaid Link token
  try {
    const client = createPlaidClient();

    const linkRequest: LinkTokenCreateRequest = {
      client_name: 'Affordly',
      user: { client_user_id: sessionId },
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      transactions: { days_requested: 210 },
    };

    const response = await client.linkTokenCreate(linkRequest);

    return NextResponse.json<PlaidLinkTokenResponse>({
      linkToken: response.data.link_token,
    });
  } catch (error: unknown) {
    // Log server-side only — never forward raw Plaid details to the browser
    console.error('[/api/plaid/link-token] Error:', (error as Error)?.message);

    return NextResponse.json<ApiErrorResponse>(
      { error: 'Unable to initiate the Plaid connection. Please try again.', code: 'connection_failed' },
      { status: 500 }
    );
  }
}
