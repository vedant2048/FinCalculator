import { amortisation, emi } from "../finance/engines";
import { formatINR } from "../format";
import { inr, num, pct, years, type CalculatorDef, type Field, type Result } from "./types";

function emiResult(principal: number, ratePct: number, tenureYears: number, note?: string): Result {
  const months = tenureYears * 12;
  const pay = emi(principal, ratePct, months);
  const total = pay * months;
  return {
    primary: { label: "Monthly EMI", value: pay, format: "inr" },
    groups: [
      {
        items: [
          { label: "Loan amount", value: principal, format: "inr" },
          { label: "Total interest", value: total - principal, format: "inr" },
          { label: "Total payment", value: total, format: "inr" },
        ],
      },
    ],
    split: [
      { label: "Principal", value: principal, format: "inr" },
      { label: "Interest", value: total - principal, format: "inr" },
    ],
    table: {
      caption: "Amortisation schedule",
      columns: [
        { label: "Year", format: "number" },
        { label: "Principal paid", format: "inr" },
        { label: "Interest paid", format: "inr" },
        { label: "Balance", format: "inr" },
      ],
      rows: amortisation(principal, ratePct, months).map((r) => [
        r.year,
        r.principal,
        r.interest,
        r.balance,
      ]),
    },
    message: note,
  };
}

function loanCalculator(
  amount: [min: number, max: number, def: number],
  rate: [min: number, max: number, def: number],
  tenure: [min: number, max: number, def: number],
): CalculatorDef {
  const fields: Field[] = [
    inr("amount", "Loan amount", ...amount),
    pct("rate", "Interest rate", ...rate, { step: 0.05 }),
    years("tenure", "Loan tenure", ...tenure),
  ];
  return {
    fields,
    compute: (v) => emiResult(num(v, "amount"), num(v, "rate"), num(v, "tenure")),
  };
}

export const homeLoanEmi = loanCalculator([1e5, 1e8, 50_00_000], [5, 15, 8.5], [1, 30, 20]);
export const personalLoanEmi = loanCalculator([10_000, 50_00_000, 5_00_000], [8, 30, 12], [1, 7, 5]);
export const carLoanEmi = loanCalculator([1e5, 1e7, 10_00_000], [6, 20, 9], [1, 8, 5]);

export const educationLoanEmi: CalculatorDef = {
  fields: [
    inr("amount", "Loan amount", 50_000, 1e7, 20_00_000),
    pct("rate", "Interest rate", 6, 18, 10, { step: 0.05 }),
    years("tenure", "Repayment tenure", 1, 15, 10),
    {
      kind: "number",
      key: "moratorium",
      label: "Moratorium period",
      unit: "months",
      min: 0,
      max: 72,
      step: 1,
      default: 0,
      hint: "Course duration plus grace period, when no EMI is paid.",
    },
  ],
  compute: (v) => {
    const principal = num(v, "amount");
    const rate = num(v, "rate");
    const mor = num(v, "moratorium");
    // Simple interest accrues during the moratorium and is added to the loan.
    const accrued = principal * (rate / 100) * (mor / 12);
    return emiResult(
      principal + accrued,
      rate,
      num(v, "tenure"),
      mor > 0
        ? `Includes ${formatINR(accrued)} of interest accrued during the moratorium.`
        : undefined,
    );
  },
  notes: [
    "Moratorium interest is simple interest added to the principal when repayment starts. Some lenders compound it or let you pay it as you go.",
  ],
};
