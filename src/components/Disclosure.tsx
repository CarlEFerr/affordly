/**
 * Retrospective product-boundary disclosure (Req 12.1).
 *
 * Must be visible in the main analysis view without navigation.
 * Must NOT be styled as a warning or error — it is informational (Req 12.6).
 */
export default function Disclosure() {
  return (
    <aside
      aria-label="About this analysis"
      className={
        'rounded-lg border border-(--color-info-border) ' +
        'bg-(--color-info-surface) px-4 py-3'
      }
    >
      <p className="text-sm text-(--color-info-text) leading-relaxed">
        <strong className="font-semibold">Historical analysis only.</strong>{' '}
        Results are based on the financial activity shown and do not predict future
        financial performance. Affordly is a retrospective exploration tool, not
        financial advice.
      </p>
    </aside>
  );
}
