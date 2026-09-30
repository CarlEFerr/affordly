/**
 * Affordly Badge — replaced with verified @nymbus/fiat Badge (Task 11.6).
 *
 * FIAT Badge type confirmed from @nymbus/fiat@1.8.1 dist/index.d.ts:
 *   type: "info" | "neutral" | "warning" | "success" | "danger"
 *   size: "sm" | "md" | "lg"
 *   startDecorator, endDecorator, asChild — all available
 *
 * DataModeBar usage updated: variant="info" → type="info".
 * StatusBadge retains its local wrapper (Req 5.2 — descriptive labels, not
 * pass/fail verdicts; Badge type="success"/"danger" would imply verdict).
 */
export { Badge as default, type BadgeProps } from '@nymbus/fiat';
