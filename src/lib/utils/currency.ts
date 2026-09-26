/**
 * Currency formatting and parsing utilities.
 *
 * formatCurrency  — display only; no validation semantics.
 * parseCurrencyString — syntactic parsing only; no business-rule enforcement.
 *
 * Business-rule validation (payment > 0, cushion >= 0) is the caller's responsibility.
 * This keeps field-specific constraints out of shared infrastructure.
 */

/**
 * Formats a number as a US dollar amount string.
 * Handles negative values naturally via Intl.NumberFormat.
 *
 * @example formatCurrency(1234.5)  → "$1,234.50"
 * @example formatCurrency(-475)    → "-$475.00"
 * @example formatCurrency(0)       → "$0.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parses a user-entered string as a USD amount.
 * Strips leading "$" and "," separators, then converts to a number.
 * Rounds to the nearest cent (2 decimal places).
 *
 * Returns null for:
 *   - empty or whitespace-only input
 *   - non-numeric input ("abc", "--5")
 *   - non-finite values ("Infinity", "NaN")
 *
 * Does NOT enforce business rules — returns a parsed number regardless of sign.
 * The caller decides whether 0, negative, or sub-cent values are valid.
 *
 * @example parseCurrencyString("$475.00") → 475
 * @example parseCurrencyString("1,200")   → 1200
 * @example parseCurrencyString("475.999") → 476  (rounded to nearest cent)
 * @example parseCurrencyString("")        → null
 * @example parseCurrencyString("abc")     → null
 * @example parseCurrencyString("Infinity")→ null
 */
export function parseCurrencyString(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '').trim();
  if (cleaned === '') return null;

  const value = parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;

  // Round to cent precision to avoid sub-cent floating-point artifacts
  return Math.round(value * 100) / 100;
}
