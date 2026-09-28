import { describe, expect, it } from "vitest";
import {
  amortisation,
  effMonthly,
  emi,
  goalSip,
  growingAnnuityPv,
  nomMonthly,
  sipForTarget,
  sipFv,
  stepupSipFv,
  swpMonths,
} from "./engines";

// tools.md §5: allow ±₹2 for rounding.
const near = (actual: number, expected: number, tol = 2) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);

describe("V1 — retirement goal-solver", () => {
  const r = goalSip({
    goalToday: 50_00_000,
    years: 30,
    inflation: 0.05,
    annualReturn: 0.125,
    existingSavings: 1_00_000,
  });

  it("matches the live site output", () => {
    near(r.inflatedGoal, 2_16_09_712);
    near(r.savingsGrown, 34_24_330);
    near(r.finalTarget, 1_81_85_382);
    near(r.monthlySip, 5_343, 1);
    // Site multiplies the rounded SIP: 5,343 × 360.
    near(Math.round(r.monthlySip) * r.months, 19_23_480);
    near(r.finalTarget - Math.round(r.monthlySip) * r.months, 1_62_61_902);
  });

  it("invested + growth == final target", () => {
    expect(r.totalInvested + r.totalGrowth).toBeCloseTo(r.finalTarget, 6);
  });

  it("zeroes the SIP when savings already cover the goal", () => {
    const covered = goalSip({
      goalToday: 10_00_000,
      years: 10,
      inflation: 0.05,
      annualReturn: 0.12,
      existingSavings: 50_00_000,
    });
    expect(covered.finalTarget).toBe(0);
    expect(covered.monthlySip).toBe(0);
  });

  it("rejects years <= 0", () => {
    expect(() => goalSip({ goalToday: 1, years: 0, inflation: 0, annualReturn: 0.1 })).toThrow();
  });
});

describe("V2 — SIP, start of month", () => {
  it("matches the live site output", () => {
    const fv = sipFv(10_000, 156, nomMonthly(0.15), true);
    near(fv, 48_14_838);
    near(fv - 15_60_000, 32_54_838);
  });
});

describe("V3 — SIP, end of month", () => {
  it("matches the live site output", () => {
    const fv = sipFv(10_000, 60, nomMonthly(0.14), false);
    near(fv, 8_61_951);
    near(fv - 6_00_000, 2_61_951);
  });
});

describe("sanity checks", () => {
  it("SIP round-trips through its inverse", () => {
    const i = effMonthly(0.12);
    const p = sipForTarget(1_00_00_000, 240, i);
    expect(sipFv(p, 240, i)).toBeCloseTo(1_00_00_000, 4);
  });

  it("zero return degrades to simple sums", () => {
    expect(sipFv(1000, 12, 0)).toBe(12_000);
    expect(sipForTarget(12_000, 12, 0)).toBe(1000);
    expect(emi(12_000, 0, 12)).toBe(1000);
  });

  it("EMI: ₹50L at 8.5% for 240 months ≈ ₹43,391", () => {
    near(emi(50_00_000, 8.5, 240), 43_391, 1);
  });

  it("amortisation pays the loan off", () => {
    const rows = amortisation(50_00_000, 8.5, 240);
    expect(rows).toHaveLength(20);
    const paid = rows.reduce((s, r) => s + r.principal, 0);
    expect(paid).toBeCloseTo(50_00_000, 2);
    expect(rows.at(-1)!.balance).toBeLessThan(1);
  });

  it("SWP: ₹1 Cr, ₹60,000/month, 8% never runs out", () => {
    expect(swpMonths(1_00_00_000, 60_000, nomMonthly(0.08))).toBe(Infinity);
  });

  it("SWP closed form matches the monthly recursion", () => {
    const i = nomMonthly(0.08);
    const n = swpMonths(50_00_000, 60_000, i);
    let bal = 50_00_000;
    let months = 0;
    while (bal > 0 && months < 1000) {
      bal = bal * (1 + i) - 60_000;
      months++;
    }
    expect(Math.ceil(n)).toBe(months);
  });

  it("step-up with 0% equals a flat start-of-month SIP", () => {
    const i = nomMonthly(0.12);
    const { fv, invested } = stepupSipFv(5000, 120, i, 0);
    expect(fv).toBeCloseTo(sipFv(5000, 120, i, true), 6);
    expect(invested).toBe(600_000);
  });

  it("growing annuity handles g == d", () => {
    expect(growingAnnuityPv(100, 0.05, 0.05, 10)).toBeCloseTo(1000 / 1.05, 8);
    // Sum form agrees with the closed form when g != d.
    let sum = 0;
    for (let t = 1; t <= 20; t++) sum += (100 * 1.05 ** (t - 1)) / 1.08 ** t;
    expect(growingAnnuityPv(100, 0.05, 0.08, 20)).toBeCloseTo(sum, 8);
  });
});
