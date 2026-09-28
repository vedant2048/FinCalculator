import { fvLump, pvLump } from "../finance/engines";
import { inr, num, pct, str, years, type CalculatorDef } from "./types";

export const lumpsum: CalculatorDef = {
  fields: [
    inr("amount", "Investment amount", 1_000, 1e9, 1_00_000),
    pct("return", "Expected return", 1, 30, 12),
    years("years", "Investment period", 1, 50, 10),
  ],
  compute: (v) => {
    const p = num(v, "amount");
    const r = num(v, "return") / 100;
    const n = num(v, "years");
    const fv = fvLump(p, r, n);
    const rows: number[][] = [];
    for (let y = 1; y <= n; y++) rows.push([y, fvLump(p, r, y)]);
    return {
      primary: { label: "Future value", value: fv, format: "inr" },
      groups: [
        {
          items: [
            { label: "Amount invested", value: p, format: "inr" },
            { label: "Total growth", value: fv - p, format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Invested", value: p, format: "inr" },
        { label: "Growth", value: fv - p, format: "inr" },
      ],
      table: {
        caption: "Value by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Value", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: ["Returns compound once a year."],
};

export const lumpsumTarget: CalculatorDef = {
  fields: [
    inr("target", "Target amount (today's value)", 1e5, 1e9, 50_00_000),
    years("years", "Years to goal", 1, 50, 10),
    pct("inflation", "Expected inflation", 0, 15, 6),
    pct("return", "Expected return", 1, 25, 12),
  ],
  compute: (v) => {
    const n = num(v, "years");
    const future = fvLump(num(v, "target"), num(v, "inflation") / 100, n);
    const today = pvLump(future, num(v, "return") / 100, n);
    return {
      primary: { label: "Invest today", value: today, format: "inr" },
      groups: [
        {
          items: [
            { label: "Inflation-adjusted target", value: future, format: "inr" },
            { label: "Total growth", value: future - today, format: "inr" },
            { label: "Years to goal", value: n, format: "years" },
          ],
        },
      ],
      split: [
        { label: "Invested", value: today, format: "inr" },
        { label: "Growth", value: future - today, format: "inr" },
      ],
    };
  },
};

const FREQS = [
  { value: "1", label: "Yearly" },
  { value: "2", label: "Half-yearly" },
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
  { value: "365", label: "Daily" },
];

export const compounding: CalculatorDef = {
  fields: [
    inr("principal", "Principal", 1_000, 1e9, 1_00_000),
    pct("rate", "Annual interest rate", 1, 30, 10),
    years("years", "Period", 1, 50, 10),
    {
      kind: "select",
      key: "freq",
      label: "Compounding frequency",
      options: FREQS,
      default: "4",
    },
  ],
  compute: (v) => {
    const p = num(v, "principal");
    const r = num(v, "rate") / 100;
    const t = num(v, "years");
    const calc = (m: number) => ({
      fv: p * (1 + r / m) ** (m * t),
      ear: ((1 + r / m) ** m - 1) * 100,
    });
    const chosen = calc(Number(str(v, "freq")));
    return {
      primary: { label: "Maturity value", value: chosen.fv, format: "inr" },
      groups: [
        {
          items: [
            { label: "Interest earned", value: chosen.fv - p, format: "inr" },
            { label: "Effective annual rate", value: chosen.ear, format: "pct" },
          ],
        },
      ],
      split: [
        { label: "Principal", value: p, format: "inr" },
        { label: "Interest", value: chosen.fv - p, format: "inr" },
      ],
      table: {
        caption: "Same investment, every compounding frequency",
        columns: [
          { label: "Frequency", format: "text" },
          { label: "Maturity value", format: "inr" },
          { label: "Effective rate", format: "pct" },
        ],
        rows: FREQS.map((f) => {
          const c = calc(Number(f.value));
          return [f.label, c.fv, c.ear];
        }),
      },
    };
  },
};

export const futureValueInflation: CalculatorDef = {
  fields: [
    inr("amount", "Cost today", 1_000, 1e9, 1_00_000),
    pct("inflation", "Expected inflation", 0, 20, 6),
    years("years", "Years from now", 1, 50, 10),
  ],
  compute: (v) => {
    const a = num(v, "amount");
    const inf = num(v, "inflation") / 100;
    const n = num(v, "years");
    const future = fvLump(a, inf, n);
    const real = pvLump(a, inf, n);
    const rows: number[][] = [];
    for (let y = 1; y <= n; y++) rows.push([y, fvLump(a, inf, y), pvLump(a, inf, y)]);
    return {
      primary: { label: "Future cost", value: future, format: "inr" },
      groups: [
        {
          items: [
            { label: "Rise in cost", value: future - a, format: "inr" },
            { label: "Today's amount will be worth", value: real, format: "inr" },
            { label: "Loss in purchasing power", value: (1 - real / a) * 100, format: "pct" },
          ],
        },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Cost", format: "inr" },
          { label: "Purchasing power", format: "inr" },
        ],
        rows,
      },
    };
  },
};
