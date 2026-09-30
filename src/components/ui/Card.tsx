/**
 * Affordly Card — re-exports @nymbus/fiat Card family (Task 11.7).
 *
 * FIAT exports: Card, CardHeader, CardTitle, CardDescription,
 *               CardContent, CardFooter, CardAction.
 *
 * Card is not currently used in Affordly's component tree (month cards
 * and surfaces use Tailwind directly). Re-exported here for future use.
 * When card-pattern surfaces are introduced, import from this module.
 */
export {
  Card as default,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@nymbus/fiat';
