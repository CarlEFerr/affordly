/**
 * Server-side Plaid client factory.
 * MUST only be imported from server-side modules (API routes, server utilities).
 * Never import in client components — this would expose PLAID_SECRET.
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

/**
 * Creates and returns a configured PlaidApi client.
 * Enforces Sandbox-only behavior for this prototype.
 * Throws a safe error if credentials are missing or environment is not sandbox.
 */
export function createPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV;

  if (!clientId || !secret) {
    // Do NOT log the actual values
    throw new Error('Plaid credentials (PLAID_CLIENT_ID, PLAID_SECRET) are not configured.');
  }

  if (env !== 'sandbox') {
    throw new Error(
      'Affordly only supports the Plaid Sandbox environment in this prototype. ' +
      'Set PLAID_ENV=sandbox in your .env.local.'
    );
  }

  const config = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  return new PlaidApi(config);
}
