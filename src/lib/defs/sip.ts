import { effMonthly, fvLump, nomMonthly, sipForTarget, sipFv, stepupSipFv } from "../finance/engines";
import { inr, num, pct, str, years, type CalculatorDef } from "./types";

export const sipCalculator: CalculatorDef = {
  fields: [
    inr("sip", "Monthly SIP", 100, 1e7, 10_000),
    {
      kind: "number",
      key: "months",
      label: "Investment period",
      unit: "months",
      min: 1,
      max: 999,
      step: 1,
      default: 120,
    },
    pct("return", "Expected return", 5, 20, 12),
    {
      kind: "select",
      key: "timing",
      label: "Instalment date",
      options: [
        { value: "start", label: "Start of month" },
        { value: "end", label: "End of month" },
      ],
      default: "start",
    },
  ],
  compute: (v) => {
    const p = num(v, "sip");
    const months = num(v, "months");
    const i = nomMonthly(num(v, "return") / 100);
    const due = str(v, "timing") === "start";
    const fv = sipFv(p, months, i, due);
    const invested = p * months;

    const rows: number[][] = [];
    for (let m = 12; m < months + 12; m += 12) {
      const mm = Math.min(m, months);
      rows.push([Math.ceil(mm / 12), p * mm, sipFv(p, mm, i, due)]);
    }

    return {
      primary: { label: "Future value", value: fv, format: "inr" },
      groups: [
        {
          items: [
            { label: "Total invested", value: invested, format: "inr" },
            { label: "Total growth", value: fv - invested, format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Invested", value: invested, format: "inr" },
        { label: "Growth", value: fv - invested, format: "inr" },
      ],
      table: {
        caption: "Growth by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Invested", format: "inr" },
          { label: "Value", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: ["Monthly rate is the annual return divided by 12."],
};

export const sipStepUp: CalculatorDef = {
  fields: [
    inr("sip", "Starting monthly SIP", 100, 1e7, 10_000),
    {
      kind: "number",
      key: "months",
      label: "Investment period",
      unit: "months",
      min: 12,
      max: 999,
      step: 1,
      default: 120,
    },
    pct("return", "Expected return", 5, 20, 12),
    pct("stepUp", "Yearly step-up", 0, 60, 10, { step: 1 }),
  ],
  compute: (v) => {
    const p = num(v, "sip");
    const months = num(v, "months");
    const i = nomMonthly(num(v, "return") / 100);
    const step = num(v, "stepUp") / 100;

    const flatFv = sipFv(p, months, i, true);
    const flatInvested = p * months;
    const up = stepupSipFv(p, months, i, step);

    const rows: number[][] = [];
    for (let m = 12; m < months + 12; m += 12) {
      const mm = Math.min(m, months);
      const y = Math.ceil(mm / 12);
      rows.push([y, p * (1 + step) ** (y - 1), sipFv(p, mm, i, true), stepupSipFv(p, mm, i, step).fv]);
    }

    return {
      primary: { label: "Future value with step-up", value: up.fv, format: "inr" },
      groups: [
        {
          title: "Without step-up",
          items: [
            { label: "Invested", value: flatInvested, format: "inr" },
            { label: "Growth", value: flatFv - flatInvested, format: "inr" },
            { label: "Future value", value: flatFv, format: "inr" },
          ],
        },
        {
          title: "With step-up",
          items: [
            { label: "Invested", value: up.invested, format: "inr" },
            { label: "Growth", value: up.fv - up.invested, format: "inr" },
            { label: "Future value", value: up.fv, format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Invested", value: up.invested, format: "inr" },
        { label: "Growth", value: up.fv - up.invested, format: "inr" },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Monthly SIP", format: "inr" },
          { label: "Flat SIP value", format: "inr" },
          { label: "Step-up value", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: [
    "The instalment rises once every 12 months. Instalments are invested at the start of each month.",
  ],
};

export const goalTopUpSip: CalculatorDef = {
  fields: [
    inr("goal", "Goal amount (today's value)", 1e5, 1e9, 50_00_000),
    years("years", "Investment period", 1, 100, 15),
    pct("return", "Expected return", 0, 25, 12),
    pct("inflation", "Expected inflation", 0, 25, 6),
    pct("topUp", "Yearly SIP top-up", 0, 100, 10, { step: 1 }),
  ],
  compute: (v) => {
    const n = num(v, "years");
    const months = n * 12;
    const i = effMonthly(num(v, "return") / 100);
    const step = num(v, "topUp") / 100;
    const inflatedGoal = fvLump(num(v, "goal"), num(v, "inflation") / 100, n);

    // FV is linear in the starting SIP, so solve with P = 1 and scale.
    const unit = stepupSipFv(1, months, i, step);
    const start = inflatedGoal / unit.fv;
    const invested = start * unit.invested;
    const flat = sipForTarget(inflatedGoal, months, i, true);

    const rows: number[][] = [];
    for (let y = 1; y <= n; y++) {
      const s = stepupSipFv(start, y * 12, i, step);
      rows.push([y, start * (1 + step) ** (y - 1), s.invested, s.fv]);
    }

    return {
      primary: { label: "Starting monthly SIP", value: start, format: "inr" },
      groups: [
        {
          items: [
            { label: "Inflation-adjusted goal", value: inflatedGoal, format: "inr" },
            { label: "Investment period", value: n, format: "years" },
            { label: "Total invested", value: invested, format: "inr" },
            { label: "Total growth", value: inflatedGoal - invested, format: "inr" },
            { label: "Flat SIP needed without top-up", value: flat, format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Invested", value: invested, format: "inr" },
        { label: "Growth", value: inflatedGoal - invested, format: "inr" },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Monthly SIP", format: "inr" },
          { label: "Invested", format: "inr" },
          { label: "Value", format: "inr" },
        ],
        rows,
      },
    };
  },
};

const FREQUENCIES: Record<string, { perYear: number; label: string }> = {
  fortnightly: { perYear: 26, label: "Fortnightly" },
  monthly: { perYear: 12, label: "Monthly" },
  quarterly: { perYear: 4, label: "Quarterly" },
};

export const sipWithAnnualIncrease: CalculatorDef = {
  fields: [
    inr("instalment", "Instalment amount", 100, 1e6, 5_000),
    {
      kind: "select",
      key: "frequency",
      label: "Frequency",
      options: Object.entries(FREQUENCIES).map(([value, f]) => ({ value, label: f.label })),
      default: "monthly",
    },
    years("years", "Investment period", 1, 40, 10),
    pct("return", "Expected return", 5, 20, 12),
    pct("increase", "Yearly enhancement", 5, 100, 10, { step: 1 }),
  ],
  compute: (v) => {
    const perYear = FREQUENCIES[str(v, "frequency")].perYear;
    const n = num(v, "years");
    const rate = (1 + num(v, "return") / 100) ** (1 / perYear) - 1;
    const inc = num(v, "increase") / 100;
    let bal = 0;
    let invested = 0;
    let cur = num(v, "instalment");
    const rows: number[][] = [];
    for (let y = 1; y <= n; y++) {
      for (let k = 0; k < perYear; k++) {
        bal = (bal + cur) * (1 + rate);
        invested += cur;
      }
      rows.push([y, cur, invested, bal]);
      cur *= 1 + inc;
    }
    return {
      primary: { label: "Future value", value: bal, format: "inr" },
      groups: [
        {
          items: [
            { label: "Total invested", value: invested, format: "inr" },
            { label: "Total growth", value: bal - invested, format: "inr" },
            { label: "Final instalment", value: rows.at(-1)![1], format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Invested", value: invested, format: "inr" },
        { label: "Growth", value: bal - invested, format: "inr" },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Instalment", format: "inr" },
          { label: "Invested", format: "inr" },
          { label: "Value", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: [
    "Projection at a constant assumed return. Scheme-based versions replay a fund's historical NAVs instead.",
    "Instalments are invested at the start of each period and rise once a year.",
  ],
};

export const spendingLess: CalculatorDef = {
  fields: [
    inr("saving", "Amount saved every month", 100, 1e5, 2_000),
    years("years", "Invest it for", 1, 40, 20),
    pct("return", "Expected return", 0, 20, 12),
  ],
  compute: (v) => {
    const p = num(v, "saving");
    const n = num(v, "years");
    const i = nomMonthly(num(v, "return") / 100);
    const fv = sipFv(p, n * 12, i, true);
    const invested = p * n * 12;
    const rows: number[][] = [];
    for (let y = 1; y <= n; y++) rows.push([y, p * y * 12, sipFv(p, y * 12, i, true)]);
    return {
      primary: { label: "Wealth created", value: fv, format: "inr" },
      groups: [
        {
          items: [
            { label: "Total amount saved", value: invested, format: "inr" },
            { label: "Growth on savings", value: fv - invested, format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Saved", value: invested, format: "inr" },
        { label: "Growth", value: fv - invested, format: "inr" },
      ],
      table: {
        caption: "Growth by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Saved", format: "inr" },
          { label: "Value", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: ["Assumes the money you stop spending is invested as a monthly SIP."],
};
