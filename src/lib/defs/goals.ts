import { effMonthly, goalSip, sipFv } from "../finance/engines";
import { age, inr, num, pct, years, type CalculatorDef, type Result, type Values } from "./types";

type GoalLabels = {
  inflatedGoal: string;
  finalTarget?: string;
};

/**
 * Shared goal-solver view (tools.md §2). Crorepati, Retirement, Target Amount,
 * Goal Setting and Children Education are thin wrappers over this.
 */
function goalResult(
  input: {
    goalToday: number;
    years: number;
    inflationPct: number;
    returnPct: number;
    savings: number;
  },
  labels: GoalLabels,
): Result {
  if (input.years <= 0) {
    return { error: "The target must be at least one year away." };
  }
  const annualReturn = input.returnPct / 100;
  const r = goalSip({
    goalToday: input.goalToday,
    years: input.years,
    inflation: input.inflationPct / 100,
    annualReturn,
    existingSavings: input.savings,
  });

  const i = effMonthly(annualReturn);
  const rows: number[][] = [];
  for (let y = 1; y <= Math.ceil(r.years); y++) {
    const m = Math.min(y * 12, r.months);
    rows.push([y, r.monthlySip * m, sipFv(r.monthlySip, m, i, true)]);
  }

  const goalItems = [
    { label: labels.inflatedGoal, value: r.inflatedGoal, format: "inr" as const },
  ];
  if (input.savings > 0) {
    goalItems.push({
      label: "Current savings will grow to",
      value: r.savingsGrown,
      format: "inr",
    });
  }
  goalItems.push({
    label: labels.finalTarget ?? "Amount to build through SIP",
    value: r.finalTarget,
    format: "inr",
  });

  return {
    primary: { label: "Monthly SIP required", value: r.monthlySip, format: "inr" },
    groups: [
      { title: "Goal", items: goalItems },
      {
        title: "SIP",
        items: [
          { label: "Years to save", value: r.years, format: "years" },
          { label: "Total invested", value: r.totalInvested, format: "inr" },
          { label: "Total growth", value: r.totalGrowth, format: "inr" },
        ],
      },
    ],
    split:
      r.finalTarget > 0
        ? [
            { label: "Invested", value: r.totalInvested, format: "inr" },
            { label: "Growth", value: r.totalGrowth, format: "inr" },
          ]
        : undefined,
    table:
      r.finalTarget > 0
        ? {
            caption: "SIP growth by year",
            columns: [
              { label: "Year", format: "number" },
              { label: "Invested", format: "inr" },
              { label: "Value", format: "inr" },
            ],
            rows,
          }
        : undefined,
    message:
      r.finalTarget === 0
        ? "Your current savings are already on track to cover this goal. No SIP needed."
        : undefined,
  };
}

const ageYears = (v: Values, from: string, to: string) => num(v, to) - num(v, from);

export const becomeACrorepati: CalculatorDef = {
  fields: [
    inr("goal", "Wealth target (today's value)", 1e7, 1e9, 1e7, { step: 1e5 }),
    age("age", "Current age", 10, 100, 30),
    age("targetAge", "Target age", 10, 100, 60),
    pct("inflation", "Expected inflation", 0, 10, 6),
    pct("return", "Expected SIP return", 5, 20, 12),
    inr("savings", "Current savings", 0, 1e7, 1_00_000, { wide: true }),
  ],
  compute: (v) =>
    ageYears(v, "age", "targetAge") <= 0
      ? { error: "Target age must be greater than current age." }
      : goalResult(
          {
            goalToday: num(v, "goal"),
            years: ageYears(v, "age", "targetAge"),
            inflationPct: num(v, "inflation"),
            returnPct: num(v, "return"),
            savings: num(v, "savings"),
          },
          { inflatedGoal: "Inflation-adjusted target", finalTarget: "Final targeted amount" },
        ),
};

export const retirementPlanning: CalculatorDef = {
  fields: [
    inr("goal", "Retirement corpus (today's value)", 50_00_000, 1e8, 1e7, { step: 1e5 }),
    age("age", "Current age", 18, 70, 30),
    age("targetAge", "Retirement age", 30, 80, 60),
    pct("inflation", "Expected inflation", 5, 15, 6),
    pct("return", "Expected return", 5, 20, 12),
    inr("savings", "Current savings", 0, 1e8, 5_00_000, { wide: true }),
  ],
  compute: (v) =>
    ageYears(v, "age", "targetAge") <= 0
      ? { error: "Retirement age must be greater than current age." }
      : goalResult(
          {
            goalToday: num(v, "goal"),
            years: ageYears(v, "age", "targetAge"),
            inflationPct: num(v, "inflation"),
            returnPct: num(v, "return"),
            savings: num(v, "savings"),
          },
          { inflatedGoal: "Corpus needed (inflation adjusted)", finalTarget: "Final targeted amount" },
        ),
  notes: [
    "This builds the corpus only. Use the SWP calculator to see how long it lasts after retirement.",
  ],
};

export const targetAmountSip: CalculatorDef = {
  fields: [
    inr("goal", "Target amount (today's value)", 1e5, 1e9, 1e7),
    years("years", "Investment period", 1, 100, 10),
    pct("inflation", "Expected inflation", 0, 10, 6),
    pct("return", "Expected SIP return", 0, 25, 12),
  ],
  compute: (v) =>
    goalResult(
      {
        goalToday: num(v, "goal"),
        years: num(v, "years"),
        inflationPct: num(v, "inflation"),
        returnPct: num(v, "return"),
        savings: 0,
      },
      { inflatedGoal: "Inflation-adjusted target" },
    ),
};

export const goalSetting: CalculatorDef = {
  fields: [
    inr("goal", "Amount you want to spend (today's value)", 1e5, 1e9, 10_00_000),
    years("years", "Years from now", 1, 30, 5),
    pct("inflation", "Expected inflation", 0, 15, 6),
    pct("return", "Expected return", 0, 25, 12),
  ],
  compute: (v) =>
    goalResult(
      {
        goalToday: num(v, "goal"),
        years: num(v, "years"),
        inflationPct: num(v, "inflation"),
        returnPct: num(v, "return"),
        savings: 0,
      },
      { inflatedGoal: "Cost when you buy it" },
    ),
};

export const childrenEducation: CalculatorDef = {
  fields: [
    inr("goal", "Education cost today", 1e5, 1e8, 20_00_000),
    age("age", "Child's current age", 0, 17, 5),
    age("targetAge", "Age when funds are needed", 1, 25, 18),
    pct("inflation", "Education inflation", 0, 15, 10, {
      hint: "Education costs usually rise faster than general inflation.",
    }),
    pct("return", "Expected return", 5, 20, 12),
    inr("savings", "Savings already set aside", 0, 1e7, 0, { wide: true }),
  ],
  compute: (v) =>
    ageYears(v, "age", "targetAge") <= 0
      ? { error: "The age when funds are needed must be greater than the child's current age." }
      : goalResult(
          {
            goalToday: num(v, "goal"),
            years: ageYears(v, "age", "targetAge"),
            inflationPct: num(v, "inflation"),
            returnPct: num(v, "return"),
            savings: num(v, "savings"),
          },
          { inflatedGoal: "Education cost when needed" },
        ),
};
