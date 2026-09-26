// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyString } from '../../lib/utils/currency';

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a positive whole dollar amount', () => {
    expect(formatCurrency(475)).toBe('$475.00');
  });

  it('formats a positive fractional amount', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats a negative amount', () => {
    const result = formatCurrency(-475);
    expect(result).toContain('475.00');
    expect(result).toContain('-');
  });

  it('formats large amounts with thousand separators', () => {
    expect(formatCurrency(4200)).toBe('$4,200.00');
  });
});

// ─── parseCurrencyString ──────────────────────────────────────────────────────

describe('parseCurrencyString', () => {
  it('parses a plain numeric string', () => {
    expect(parseCurrencyString('475')).toBe(475);
  });

  it('strips a leading dollar sign', () => {
    expect(parseCurrencyString('$475.00')).toBe(475);
  });

  it('strips thousand-separator commas', () => {
    expect(parseCurrencyString('1,200')).toBe(1200);
    expect(parseCurrencyString('$4,200.00')).toBe(4200);
  });

  it('parses decimal values', () => {
    expect(parseCurrencyString('475.50')).toBe(475.5);
  });

  it('rounds sub-cent precision to nearest cent', () => {
    expect(parseCurrencyString('475.999')).toBe(476);
    expect(parseCurrencyString('100.004')).toBe(100);
    expect(parseCurrencyString('100.005')).toBe(100.01);
  });

  it('returns null for empty string', () => {
    expect(parseCurrencyString('')).toBeNull();
    expect(parseCurrencyString('   ')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseCurrencyString('abc')).toBeNull();
    expect(parseCurrencyString('$abc')).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(parseCurrencyString('Infinity')).toBeNull();
    expect(parseCurrencyString('-Infinity')).toBeNull();
  });

  it('returns null for NaN-producing input', () => {
    expect(parseCurrencyString('NaN')).toBeNull();
  });

  // Note: parseCurrencyString does NOT enforce business rules.
  // Callers decide whether zero or negative values are valid.
  it('parses zero (validation is callers responsibility)', () => {
    expect(parseCurrencyString('0')).toBe(0);
  });

  it('parses negative values (validation is callers responsibility)', () => {
    expect(parseCurrencyString('-300')).toBe(-300);
  });
});
