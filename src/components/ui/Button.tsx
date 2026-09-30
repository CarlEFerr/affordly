/**
 * Affordly Button — replaced with verified @nymbus/fiat Button (Task 11.5).
 *
 * FIAT Button variants confirmed from @nymbus/fiat@1.8.1 dist/index.d.ts:
 *   variant: "primary" | "secondary" | "outline" | "ghost" | "text"
 *   size:    "default" | "sm" | "lg" | "icon" | "icon-sm" | "nav"
 *   pill, fullWidth, asChild, loading, leftIcon — all available
 *
 * Affordly uses variant="primary" and variant="ghost" — both map directly.
 * No shim needed; this is a direct re-export.
 */
export { Button as default } from '@nymbus/fiat';
export type { ButtonProps } from '@nymbus/fiat';
