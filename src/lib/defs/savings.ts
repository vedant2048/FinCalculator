import { nomMonthly, swpMonths } from "../finance/engines";
import { EPF, PPF } from "../finance/rates";
import { formatMonths } from "../format";
import { age, inr, num, pct, years, type CalculatorDef } from "./types";

export const ppf: CalculatorDef = {
  fields: [
    inr("deposit", "Yearly deposit", PPF.minYearlyDeposit, PPF.maxYearlyDeposit, PPF.maxYearlyDeposit, {
      hint: "Maximum ₹1.5 lakh per financial year.",
      wide: true,
    }),
    years("years", "Tenure", 15, 50, 15, {
      hint: "15-year lock-in, extendable in blocks of 5 years.",
    }),
    pct("rate", "Interest rate", 1, 12, PPF.ratePct, {
      step: 0.05,
      hint: `${PPF.ratePct}% as of ${PPF.asOf}. The government revises it quarterly.`,
    }),
  ],
  compute: (v) => {
    const d = num(v, "deposit");
    const r = num(v, "rate") / 100;
    const n = num(v, "years");
    let bal = 0;
    const rows: number[][] = [];
    for (let y = 1; y <= n; y++) {
      const interest = (bal + d) * r;
      bal = bal + d + interest;
      rows.push([y, d, interest, bal]);
    }
    const invested = d * n;
    return {
      primary: { label: "Maturity value", value: bal, format: "inr" },
      groups: [
        {
          items: [
            { label: "Total deposited", value: invested, format: "inr" },
            { label: "Total interest (tax-free)", value: bal - invested, format: "inr" },
          ],
        },
      ],
      split: [
        { label: "Deposited", value: invested, format: "inr" },
        { label: "Interest", value: bal - invested, format: "inr" },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Deposit", format: "inr" },
          { label: "Interest", format: "inr" },
          { label: "Balance", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: [
    "Simplified: deposits at the start of each year with annual compounding. In practice interest is calculated monthly on the lowest balance between the 5th and month-end, and credited yearly.",
    "Tenure is limited to 15 years or 15 + multiples of 5; other values are shown for illustration.",
  ],
};

export const epf: CalculatorDef = {
  fields: [
    inr("basic", "Monthly basic salary + DA", 1_000, 1e6, 30_000),
    age("age", "Current age", 18, 60, 25),
    age("retireAge", "Retirement age", 19, 60, 58),
    inr("balance", "Current EPF balance", 0, 1e8, 0, { wide: true }),
    pct("salaryGrowth", "Expected yearly salary increase", 0, 20, 5),
    pct("rate", "EPF interest rate", 1, 15, EPF.ratePct, {
      step: 0.05,
      hint: `${EPF.ratePct}% declared for ${EPF.asOf}.`,
    }),
    pct("employee", "Employee contribution", 0, 20, EPF.employeePct, { step: 0.5 }),
    pct("employer", "Employer contribution", 0, 20, EPF.employerPct, { step: 0.5 }),
  ],
  compute: (v) => {
    const years = num(v, "retireAge") - num(v, "age");
    if (years <= 0) return { error: "Retirement age must be greater than current age." };

    const monthlyRate = num(v, "rate") / 100 / 12;
    const g = num(v, "salaryGrowth") / 100;
    const ep = num(v, "employee") / 100;
    const er = num(v, "employer") / 100;

    let bal = num(v, "balance");
    let totEmp = 0;
    let totEr = 0;
    let totEps = 0;
    let totInterest = 0;
    const rows: number[][] = [];

    for (let y = 1; y <= years; y++) {
      const salary = num(v, "basic") * (1 + g) ** (y - 1);
      const emp = salary * ep;
      // Employer share: 8.33% of wage (capped) goes to the pension scheme (EPS).
      const eps = Math.min(salary * er, Math.min(salary, EPF.epsWageCeiling) * (EPF.epsPct / 100));
      const erEpf = salary * er - eps;
      let interest = 0;
      for (let m = 0; m < 12; m++) {
        bal += emp + erEpf;
        interest += bal * monthlyRate;
      }
      bal += interest; // credited once a year
      totEmp += emp * 12;
      totEr += erEpf * 12;
      totEps += eps * 12;
      totInterest += interest;
      rows.push([y, salary, (emp + erEpf) * 12, interest, bal]);
    }

    return {
      primary: { label: "EPF corpus at retirement", value: bal, format: "inr" },
      groups: [
        {
          items: [
            { label: "Your contributions", value: totEmp, format: "inr" },
            { label: "Employer contributions to EPF", value: totEr, format: "inr" },
            { label: "Interest earned", value: totInterest, format: "inr" },
            { label: "Years of service", value: years, format: "years" },
          ],
        },
        {
          title: "Pension (EPS)",
          items: [{ label: "Employer share diverted to EPS", value: totEps, format: "inr" }],
        },
      ],
      split: [
        { label: "Contributions", value: bal - totInterest, format: "inr" },
        { label: "Interest", value: totInterest, format: "inr" },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Monthly basic", format: "inr" },
          { label: "Contributed", format: "inr" },
          { label: "Interest", format: "inr" },
          { label: "Balance", format: "inr" },
        ],
        rows,
      },
    };
  },
  notes: [
    `Simplified: 8.33% of wage, capped at a ₹${EPF.epsWageCeiling.toLocaleString("en-IN")} wage ceiling, of the employer's share goes to EPS and is not part of the EPF corpus. Interest accrues monthly and is credited yearly.`,
    "Verify current EPFO contribution rules before relying on these figures.",
  ],
};

export const swp: CalculatorDef = {
  fields: [
    inr("corpus", "Starting corpus", 1e5, 1e9, 1e7),
    inr("withdrawal", "Monthly withdrawal", 1_000, 1e7, 80_000),
    pct("return", "Expected return", 0, 20, 8),
    years("years", "Tenure", 1, 50, 20),
  ],
  compute: (v) => {
    const corpus = num(v, "corpus");
    const w = num(v, "withdrawal");
    const i = nomMonthly(num(v, "return") / 100);
    const months = num(v, "years") * 12;

    let bal = corpus;
    let withdrawn = 0;
    let yWithdrawn = 0;
    let exhaustedAt: number | null = null;
    const rows: number[][] = [];
    for (let m = 1; m <= months; m++) {
      bal *= 1 + i;
      const take = Math.min(w, bal);
      bal -= take;
      withdrawn += take;
      yWithdrawn += take;
      if (bal <= 0 && exhaustedAt === null) exhaustedAt = m;
      if (m % 12 === 0 || exhaustedAt !== null) {
        rows.push([Math.ceil(m / 12), yWithdrawn, bal]);
        yWithdrawn = 0;
      }
      if (exhaustedAt !== null) break;
    }

    const lasts = swpMonths(corpus, w, i);
    const lastsLabel = !Number.isFinite(lasts)
      ? "Never runs out"
      : exhaustedAt !== null
        ? formatMonths(exhaustedAt)
        : `${formatMonths(lasts)} (beyond tenure)`;

    return {
      primary: { label: "Corpus lasts", value: lastsLabel, format: "text" },
      groups: [
        {
          items: [
            { label: "Total withdrawn", value: withdrawn, format: "inr" },
            { label: "Balance at end of tenure", value: bal, format: "inr" },
            { label: "Returns earned", value: withdrawn + bal - corpus, format: "inr" },
          ],
        },
      ],
      table: {
        caption: "Year by year",
        columns: [
          { label: "Year", format: "number" },
          { label: "Withdrawn", format: "inr" },
          { label: "Balance", format: "inr" },
        ],
        rows,
      },
      message: !Number.isFinite(lasts)
        ? "Monthly returns cover the withdrawal, so the corpus lasts through the tenure and beyond."
        : exhaustedAt !== null
          ? `The corpus runs out in month ${exhaustedAt}, before the tenure ends.`
          : undefined,
    };
  },
  notes: [
    "Returns are credited monthly at the annual rate divided by 12, then the withdrawal is taken.",
  ],
};
