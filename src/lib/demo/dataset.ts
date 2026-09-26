/**
 * Deterministic Demo Mode financial dataset.
 *
 * Represents a fictional checking account (persona: Alex) with six complete
 * historical months. Dates are derived relative to the caller's `today` so
 * the experience always shows real calendar months regardless of when the app runs.
 *
 * Approved defaults and expected outcomes (payment=$475, cushion=$300):
 *   M-1:  cashFlow=+620  simulated=+145  → Below Cushion
 *   M-2:  cashFlow=+980  simulated=+505  → Above Cushion
 *   M-3:  cashFlow=+320  simulated=-155  → Negative
 *   M-4:  cashFlow=+1250 simulated=+775  → Above Cushion
 *   M-5:  cashFlow=+710  simulated=+235  → Below Cushion
 *   M-6:  cashFlow=+880  simulated=+405  → Above Cushion
 *
 * M-1 has a large annual outflow (car insurance) — informative in month detail.
 * M-4 has a large bonus inflow — explains the unusually strong month.
 * No interpretations or explanations are generated; the data speaks for itself.
 */

export const DEMO_DEFAULT_PAYMENT = 475;
export const DEMO_DEFAULT_CUSHION = 300;

/** One configured transaction within a demo month (day-of-month relative) */
interface DemoTxConfig {
  id: string;
  dayOfMonth: number; // 1–28 (safe for all calendar months, including February)
  amount: number;     // positive=inflow, negative=outflow (already in Affordly convention)
  description: string;
}

/** Configuration for one demo month (index 0 = M-1, index 5 = M-6) */
interface DemoMonthConfig {
  transactions: DemoTxConfig[];
}

/**
 * Month configurations ordered M-1 first (most recent, index 0).
 * Verify cash flows after any edit:
 *   cashFlow = sum(positive amounts) − sum(|negative amounts|)
 */
const MONTH_CONFIGS: DemoMonthConfig[] = [
  // ── M-1: cashIn=4200, cashOut=3580, cashFlow=+620 → sim=+145 → Below Cushion
  {
    transactions: [
      { id: 'm1-t1', dayOfMonth: 1,  amount:  4200,  description: 'Payroll Deposit'       },
      { id: 'm1-t2', dayOfMonth: 3,  amount: -1400,  description: 'Rent Payment'           },
      { id: 'm1-t3', dayOfMonth: 8,  amount: -1680,  description: 'Annual Car Insurance'   }, // ← large outflow, noteworthy
      { id: 'm1-t4', dayOfMonth: 15, amount:  -300,  description: 'Subscriptions'          },
      { id: 'm1-t5', dayOfMonth: 22, amount:  -200,  description: 'Dining'                 },
      // cashIn=4200, cashOut=1400+1680+300+200=3580, cashFlow=+620 ✓
    ],
  },

  // ── M-2: cashIn=4200, cashOut=3220, cashFlow=+980 → sim=+505 → Above Cushion
  {
    transactions: [
      { id: 'm2-t1', dayOfMonth: 1,  amount:  4200,  description: 'Payroll Deposit'        },
      { id: 'm2-t2', dayOfMonth: 3,  amount: -1400,  description: 'Rent Payment'            },
      { id: 'm2-t3', dayOfMonth: 10, amount:  -900,  description: 'Groceries & Household'   },
      { id: 'm2-t4', dayOfMonth: 18, amount:  -920,  description: 'Utilities & Bills'       },
      // cashIn=4200, cashOut=1400+900+920=3220, cashFlow=+980 ✓
    ],
  },

  // ── M-3: cashIn=4200, cashOut=3880, cashFlow=+320 → sim=-155 → Negative
  {
    transactions: [
      { id: 'm3-t1', dayOfMonth: 1,  amount:  4200,  description: 'Payroll Deposit'        },
      { id: 'm3-t2', dayOfMonth: 3,  amount: -1400,  description: 'Rent Payment'            },
      { id: 'm3-t3', dayOfMonth: 12, amount: -1480,  description: 'Home Repair'             }, // ← large unexpected expense
      { id: 'm3-t4', dayOfMonth: 20, amount: -1000,  description: 'Travel'                  },
      // cashIn=4200, cashOut=1400+1480+1000=3880, cashFlow=+320 ✓
    ],
  },

  // ── M-4: cashIn=5700, cashOut=4450, cashFlow=+1250 → sim=+775 → Above Cushion
  {
    transactions: [
      { id: 'm4-t1', dayOfMonth: 1,  amount:  4200,  description: 'Payroll Deposit'        },
      { id: 'm4-t2', dayOfMonth: 5,  amount:  1500,  description: 'Performance Bonus'      }, // ← large inflow, noteworthy; $1500 so it ranks in top-3
      { id: 'm4-t3', dayOfMonth: 3,  amount: -1400,  description: 'Rent Payment'            },
      { id: 'm4-t4', dayOfMonth: 15, amount: -3050,  description: 'Monthly Expenses'        },
      // cashIn=4200+1500=5700, cashOut=1400+3050=4450, cashFlow=+1250 ✓
      // top-3 by |amount|: Payroll(4200), Expenses(3050), Bonus(1500) — Rent(1400) ranks 4th
    ],
  },

  // ── M-5: cashIn=4200, cashOut=3490, cashFlow=+710 → sim=+235 → Below Cushion
  {
    transactions: [
      { id: 'm5-t1', dayOfMonth: 1,  amount:  4200,  description: 'Payroll Deposit'        },
      { id: 'm5-t2', dayOfMonth: 3,  amount: -1400,  description: 'Rent Payment'            },
      { id: 'm5-t3', dayOfMonth: 10, amount: -1290,  description: 'Insurance & Bills'       },
      { id: 'm5-t4', dayOfMonth: 20, amount:  -800,  description: 'Shopping & Entertainment'},
      // cashIn=4200, cashOut=1400+1290+800=3490, cashFlow=+710 ✓
    ],
  },

  // ── M-6: cashIn=4200, cashOut=3320, cashFlow=+880 → sim=+405 → Above Cushion
  {
    transactions: [
      { id: 'm6-t1', dayOfMonth: 1,  amount:  4200,  description: 'Payroll Deposit'        },
      { id: 'm6-t2', dayOfMonth: 3,  amount: -1400,  description: 'Rent Payment'            },
      { id: 'm6-t3', dayOfMonth: 12, amount: -1920,  description: 'Monthly Expenses'        },
      // cashIn=4200, cashOut=1400+1920=3320, cashFlow=+880 ✓
    ],
  },
];

export { MONTH_CONFIGS };
