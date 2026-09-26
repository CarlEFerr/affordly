'use client';

/**
 * Payment and cushion input panel with approved debounce behavior.
 *
 * Interaction spec (design §12.6):
 *   - Raw string updates immediately on every keystroke.
 *   - Valid value commits after ~200ms of no typing (debounced).
 *   - Blur commits/formats the value immediately.
 *   - Invalid input clears the committed value immediately (no stale results).
 *   - No third-party debounce library — uses useRef + setTimeout.
 *
 * Business rules enforced here:
 *   - proposedPayment > 0   (Req 2.5)
 *   - cushionTarget >= 0    (Req 3.7)
 */
import { useState, useRef, useCallback } from 'react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { parseCurrencyString, formatCurrency } from '@/lib/utils/currency';

const DEBOUNCE_MS = 200;

interface InputPanelProps {
  defaultPayment: number;
  defaultCushion: number;
  onPaymentChange: (value: number | null) => void;
  onCushionChange: (value: number | null) => void;
}

export default function InputPanel({
  defaultPayment,
  defaultCushion,
  onPaymentChange,
  onCushionChange,
}: InputPanelProps) {
  const [rawPayment, setRawPayment] = useState(String(defaultPayment));
  const [rawCushion, setRawCushion] = useState(String(defaultCushion));
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cushionError, setCushionError] = useState<string | null>(null);
  const paymentDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cushionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validatePayment = useCallback(
    (raw: string): { value: number | null; error: string | null } => {
      const parsed = parseCurrencyString(raw);
      if (raw.trim() === '') return { value: null, error: 'Enter a payment amount greater than $0.' };
      if (parsed === null) return { value: null, error: 'Enter a valid dollar amount.' };
      if (parsed <= 0) return { value: null, error: 'Payment amount must be greater than $0.' };
      return { value: parsed, error: null };
    },
    []
  );

  const validateCushion = useCallback(
    (raw: string): { value: number | null; error: string | null } => {
      const parsed = parseCurrencyString(raw);
      if (raw.trim() === '') return { value: null, error: 'Enter a monthly cushion target ($0 or more).' };
      if (parsed === null) return { value: null, error: 'Enter a valid dollar amount.' };
      if (parsed < 0) return { value: null, error: 'Cushion must be $0 or more.' };
      return { value: parsed, error: null };
    },
    []
  );

  const handlePaymentChange = useCallback(
    (raw: string) => {
      setRawPayment(raw);
      if (paymentDebounce.current) clearTimeout(paymentDebounce.current);
      const { value, error } = validatePayment(raw);
      if (error) {
        setPaymentError(error);
        onPaymentChange(null);
        return;
      }
      setPaymentError(null);
      paymentDebounce.current = setTimeout(() => {
        onPaymentChange(value);
      }, DEBOUNCE_MS);
    },
    [onPaymentChange, validatePayment]
  );

  const handlePaymentBlur = useCallback(() => {
    if (paymentDebounce.current) clearTimeout(paymentDebounce.current);
    const { value, error } = validatePayment(rawPayment);
    setPaymentError(error);
    if (value !== null) {
      onPaymentChange(value);
      setRawPayment(String(value % 1 === 0 ? value : value.toFixed(2)));
    } else {
      onPaymentChange(null);
    }
  }, [rawPayment, onPaymentChange, validatePayment]);

  const handleCushionChange = useCallback(
    (raw: string) => {
      setRawCushion(raw);
      if (cushionDebounce.current) clearTimeout(cushionDebounce.current);
      const { value, error } = validateCushion(raw);
      if (error) {
        setCushionError(error);
        onCushionChange(null);
        return;
      }
      setCushionError(null);
      cushionDebounce.current = setTimeout(() => {
        onCushionChange(value);
      }, DEBOUNCE_MS);
    },
    [onCushionChange, validateCushion]
  );

  const handleCushionBlur = useCallback(() => {
    if (cushionDebounce.current) clearTimeout(cushionDebounce.current);
    const { value, error } = validateCushion(rawCushion);
    setCushionError(error);
    if (value !== null) {
      onCushionChange(value);
      setRawCushion(String(value % 1 === 0 ? value : value.toFixed(2)));
    } else {
      onCushionChange(null);
    }
  }, [rawCushion, onCushionChange, validateCushion]);

  // Suppress the unused import warning — formatCurrency used for aria-label context
  void formatCurrency;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <div className="flex-1">
        <CurrencyInput
          id="proposed-payment"
          label="Proposed monthly payment"
          hint="The recurring payment you're evaluating"
          value={rawPayment}
          onChange={handlePaymentChange}
          onBlur={handlePaymentBlur}
          error={paymentError}
          placeholder="475"
        />
      </div>
      <div className="flex-1">
        <CurrencyInput
          id="monthly-cushion"
          label="Monthly cushion I want to keep"
          hint="Your personal target — not a recommendation"
          value={rawCushion}
          onChange={handleCushionChange}
          onBlur={handleCushionBlur}
          error={cushionError}
          placeholder="300"
        />
      </div>
    </div>
  );
}
