// Core finance engines, ported from tools.md §2.
// Rates are decimals (0.125 = 12.5%) unless a name says `Pct`.
// Nothing here rounds; round only for display.

/** Effective monthly rate from an annual decimal rate (0.125 -> 0.0098636). */
export function effMonthly(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

/** Nominal monthly rate: simple division by 12. */
export function nomMonthly(annualRate: number): number {
  return annualRate / 12;
}

/** Engine 1: lump sum growth. Also used for inflation (rate = inflation). */
export function fvLump(pv: number, annualRate: number, years: number): number {
  return pv * (1 + annualRate) ** years;
}

/** Inverse of Engine 1. */
export function pvLump(fv: number, annualRate: number, years: number): number {
  return fv / (1 + annualRate) ** years;
}

/**
 * Engine 2: future value of a fixed monthly SIP.
 * i = monthly rate (decimal). due = true -> invested at start of month.
 */
export function sipFv(payment: number, months: number, i: number, due = true): number {
  if (i === 0) return payment * months;
  const factor = ((1 + i) ** months - 1) / i;
  return payment * factor * (due ? 1 + i : 1);
}

/** Engine 3: monthly SIP needed to reach `target` (inverse of Engine 2). */
export function sipForTarget(target: number, months: number, i: number, due = true): number {
  if (months <= 0) return 0;
  return target / sipFv(1, months, i, due);
}

/**
 * Step-up SIP: instalment rises by stepAnnual (decimal) every 12 months.
 * Start-of-month payments.
 */
export function stepupSipFv(
  startPayment: number,
  months: number,
  i: number,
  stepAnnual: number,
): { invested: number; fv: number } {
  let bal = 0;
  let cur = startPayment;
  let invested = 0;
  for (let m = 1; m <= months; m++) {
    bal = (bal + cur) * (1 + i);
    invested += cur;
    if (m % 12 === 0) cur *= 1 + stepAnnual;
  }
  return { invested, fv: bal };
}

/** Monthly EMI. Rate is an annual percentage (8.5 = 8.5%). */
export function emi(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
}

export type AmortRow = {
  year: number;
  principal: number;
  interest: number;
  balance: number;
};

/** Amortisation schedule, aggregated per year. */
export function amortisation(
  principal: number,
  annualRatePct: number,
  months: number,
): AmortRow[] {
  const r = annualRatePct / 12 / 100;
  const pay = emi(principal, annualRatePct, months);
  const rows: AmortRow[] = [];
  let balance = principal;
  let yPrincipal = 0;
  let yInterest = 0;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPart = pay - interest;
    balance -= principalPart;
    yPrincipal += principalPart;
    yInterest += interest;
    if (m % 12 === 0 || m === months) {
      rows.push({
        year: Math.ceil(m / 12),
        principal: yPrincipal,
        interest: yInterest,
        balance: Math.max(0, balance),
      });
      yPrincipal = 0;
      yInterest = 0;
    }
  }
  return rows;
}

/**
 * Months a corpus lasts under a fixed monthly withdrawal (monthly rate i).
 * Returns Infinity if withdrawals never exhaust it (growth >= withdrawal).
 */
export function swpMonths(balance: number, withdrawal: number, i: number): number {
  if (withdrawal <= 0) return Infinity;
  if (balance * i >= withdrawal) return Infinity;
  if (i === 0) return balance / withdrawal;
  return -Math.log(1 - (balance * i) / withdrawal) / Math.log(1 + i);
}

export type GoalSipInput = {
  goalToday: number;
  years: number;
  inflation: number;
  annualReturn: number;
  existingSavings?: number;
};

export type GoalSipResult = {
  years: number;
  months: number;
  inflatedGoal: number;
  /** Future value of existing savings (the site labels this "growth of savings"). */
  savingsGrown: number;
  finalTarget: number;
  monthlySip: number;
  totalInvested: number;
  totalGrowth: number;
};

/**
 * The goal-solver recipe (tools.md §2): inflate the goal, subtract the grown
 * savings, then solve for the SIP using the EFFECTIVE monthly rate and
 * start-of-month payments.
 */
export function goalSip({
  goalToday,
  years,
  inflation,
  annualReturn,
  existingSavings = 0,
}: GoalSipInput): GoalSipResult {
  if (years <= 0) throw new RangeError("years must be greater than 0");
  const months = Math.round(years * 12);
  const inflatedGoal = fvLump(goalToday, inflation, years);
  const savingsGrown = fvLump(existingSavings, annualReturn, years);
  const finalTarget = Math.max(0, inflatedGoal - savingsGrown);
  const monthlySip = sipForTarget(finalTarget, months, effMonthly(annualReturn), true);
  const totalInvested = monthlySip * months;
  return {
    years,
    months,
    inflatedGoal,
    savingsGrown,
    finalTarget,
    monthlySip,
    totalInvested,
    totalGrowth: finalTarget - totalInvested,
  };
}

/**
 * Present value of a growing annuity: X next year, growing at g, discounted at d,
 * for n years (tools.md §3.7 #26).
 */
export function growingAnnuityPv(x: number, g: number, d: number, n: number): number {
  if (n <= 0) return 0;
  if (Math.abs(g - d) < 1e-12) return (x * n) / (1 + d);
  return (x * (1 - ((1 + g) / (1 + d)) ** n)) / (d - g);
}
