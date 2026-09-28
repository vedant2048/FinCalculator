import { growingAnnuityPv } from "../finance/engines";
import { CII, CII_AS_OF } from "../finance/rates";
import { age, inr, num, pct, str, type CalculatorDef, type SelectField } from "./types";

// ---- Asset allocation ------------------------------------------------------
// The scoring and bucket table are configuration, not a verified method
// (tools.md §3.7 #24). Each answer scores 0–3; the total picks a profile.

const question = (key: string, label: string, answers: string[]): SelectField => ({
  kind: "select",
  key,
  label,
  options: answers.map((a, i) => ({ value: String(i), label: a })),
  default: "1",
  section: "Risk profile",
});

export const ALLOCATION_PROFILES = [
  { upTo: 3, name: "Conservative", equity: 20, debt: 70, gold: 10 },
  { upTo: 6, name: "Moderately conservative", equity: 35, debt: 55, gold: 10 },
  { upTo: 9, name: "Moderate", equity: 50, debt: 40, gold: 10 },
  { upTo: 12, name: "Aggressive", equity: 70, debt: 20, gold: 10 },
];

export const assetAllocation: CalculatorDef = {
  fields: [
    inr("amount", "Amount to invest", 10_000, 1e9, 10_00_000, { section: "Investment" }),
    question("age", "Your age", ["60 or above", "45 – 59", "30 – 44", "Under 30"]),
    question("horizon", "When will you need this money?", [
      "Within 1 year",
      "1 – 3 years",
      "3 – 7 years",
      "More than 7 years",
    ]),
    question("income", "How stable is your income?", [
      "Irregular or retired",
      "Somewhat stable",
      "Stable",
      "Very stable, with surplus",
    ]),
    question("reaction", "If your portfolio fell 20% in a year, you would…", [
      "Sell everything",
      "Sell some",
      "Hold",
      "Invest more",
    ]),
  ],
  compute: (v) => {
    const score = ["age", "horizon", "income", "reaction"].reduce((s, k) => s + Number(str(v, k)), 0);
    const profile = ALLOCATION_PROFILES.find((p) => score <= p.upTo)!;
    const amount = num(v, "amount");
    const share = (p: number) => (amount * p) / 100;
    return {
      primary: { label: "Your risk profile", value: profile.name, format: "text" },
      groups: [
        {
          title: "Suggested allocation",
          items: [
            { label: `Equity (${profile.equity}%)`, value: share(profile.equity), format: "inr" },
            { label: `Debt (${profile.debt}%)`, value: share(profile.debt), format: "inr" },
            { label: `Gold (${profile.gold}%)`, value: share(profile.gold), format: "inr" },
          ],
        },
        { items: [{ label: "Risk score", value: `${score} / 12`, format: "text" }] },
      ],
      table: {
        caption: "All profiles",
        columns: [
          { label: "Profile", format: "text" },
          { label: "Score", format: "text" },
          { label: "Equity", format: "pct" },
          { label: "Debt", format: "pct" },
          { label: "Gold", format: "pct" },
        ],
        rows: ALLOCATION_PROFILES.map((p, i) => [
          p.name,
          `${i === 0 ? 0 : ALLOCATION_PROFILES[i - 1].upTo + 1} – ${p.upTo}`,
          p.equity,
          p.debt,
          p.gold,
        ]),
      },
    };
  },
  notes: [
    "A simple rule-based guide, not personalised advice. The score bands and allocation mix are illustrative.",
  ],
};

// ---- Cost Inflation Index --------------------------------------------------

const ciiYears = Object.keys(CII);
const fySelect = (key: string, label: string, def: string): SelectField => ({
  kind: "select",
  key,
  label,
  options: ciiYears.map((y) => ({ value: y, label: `FY ${y}` })),
  default: def,
});

export const costInflationIndex: CalculatorDef = {
  fields: [
    fySelect("buyYear", "Year of purchase", "2010-11"),
    fySelect("sellYear", "Year of sale", ciiYears.at(-1)!),
    inr("cost", "Purchase cost", 1_000, 1e9, 10_00_000),
    inr("sale", "Sale price", 1_000, 1e9, 40_00_000),
  ],
  compute: (v) => {
    const buy = str(v, "buyYear");
    const sell = str(v, "sellYear");
    if (sell < buy) return { error: "The year of sale can't be before the year of purchase." };
    const cost = num(v, "cost");
    const sale = num(v, "sale");
    const indexed = (cost * CII[sell]) / CII[buy];
    return {
      primary: { label: "Indexed cost of acquisition", value: indexed, format: "inr" },
      groups: [
        {
          items: [
            { label: `CII in FY ${buy}`, value: CII[buy], format: "number" },
            { label: `CII in FY ${sell}`, value: CII[sell], format: "number" },
          ],
        },
        {
          title: "Capital gain",
          items: [
            { label: "With indexation", value: sale - indexed, format: "inr" },
            { label: "Without indexation", value: sale - cost, format: "inr" },
          ],
        },
      ],
      message:
        "Indexation was withdrawn for most assets transferred on or after 23 July 2024, with limited relief for some land and buildings. Check whether it still applies to your sale.",
    };
  },
  notes: [
    `Base year 2001-02 = 100. Index values as per CBDT, latest ${CII_AS_OF}.`,
    "For assets bought before 1 April 2001, use their fair market value on that date as the cost with FY 2001-02.",
  ],
};

// ---- Human Life Value ------------------------------------------------------

export const humanLifeValue: CalculatorDef = {
  fields: [
    age("age", "Current age", 18, 65, 30, { section: "You" }),
    age("retireAge", "Retirement age", 19, 75, 60, { section: "You" }),
    inr("income", "Annual income", 1e5, 1e9, 12_00_000, { section: "Income" }),
    inr("expenses", "Your own yearly expenses", 0, 1e8, 3_00_000, {
      section: "Income",
      hint: "Money spent on yourself, which your family won't need to replace.",
      wide: true,
    }),
    pct("growth", "Expected yearly income growth", 0, 15, 6, { section: "Income" }),
    pct("discount", "Discount rate", 1, 15, 8, {
      section: "Income",
      hint: "Return the family could earn on the payout, net of tax.",
    }),
    inr("liabilities", "Outstanding loans", 0, 1e9, 20_00_000, { section: "Adjustments", wide: true }),
    inr("cover", "Existing life cover", 0, 1e9, 50_00_000, { section: "Adjustments", wide: true }),
    inr("investments", "Existing investments", 0, 1e9, 10_00_000, { section: "Adjustments", wide: true }),
  ],
  compute: (v) => {
    const n = num(v, "retireAge") - num(v, "age");
    if (n <= 0) return { error: "Retirement age must be greater than current age." };
    const g = num(v, "growth") / 100;
    const d = num(v, "discount") / 100;
    const net = num(v, "income") - num(v, "expenses");
    if (net <= 0) return { error: "Income must be higher than your own expenses." };

    const hlv = growingAnnuityPv(net * (1 + g), g, d, n);
    const need = hlv + num(v, "liabilities");
    const gap = need - num(v, "cover") - num(v, "investments");
    return {
      primary: { label: "Additional life cover needed", value: Math.max(0, gap), format: "inr" },
      groups: [
        {
          items: [
            { label: "Human life value (income to replace)", value: hlv, format: "inr" },
            { label: "Plus outstanding loans", value: num(v, "liabilities"), format: "inr" },
            { label: "Total cover needed", value: need, format: "inr" },
            { label: "Less existing cover and investments", value: num(v, "cover") + num(v, "investments"), format: "inr" },
          ],
        },
        {
          title: "Rule of thumb",
          items: [
            { label: "10× annual income", value: num(v, "income") * 10, format: "inr" },
            { label: "15× annual income", value: num(v, "income") * 15, format: "inr" },
          ],
        },
      ],
      message: gap <= 0 ? "Your existing cover and investments already meet the estimated need." : undefined,
    };
  },
  notes: [
    "Present-value method: the income your family would lose until your retirement, minus your own expenses, discounted to today.",
  ],
};

// ---- Net worth -------------------------------------------------------------

const asset = (key: string, label: string, def: number) =>
  inr(key, label, 0, 1e9, def, { section: "Assets", wide: true });
const liability = (key: string, label: string, def: number) =>
  inr(key, label, 0, 1e9, def, { section: "Liabilities", wide: true });

const ASSET_KEYS = ["cash", "investments", "retirement", "property", "otherAssets"];
const LIABILITY_KEYS = ["homeLoan", "otherLoans", "cards", "otherLiabilities"];

export const netWorth: CalculatorDef = {
  fields: [
    asset("cash", "Cash and bank balance", 2_00_000),
    asset("investments", "Investments (stocks, MFs, FDs)", 10_00_000),
    asset("retirement", "Retirement savings (EPF, PPF, NPS)", 5_00_000),
    asset("property", "Property", 0),
    asset("otherAssets", "Other assets (gold, vehicle)", 0),
    liability("homeLoan", "Home loan", 0),
    liability("otherLoans", "Car and personal loans", 0),
    liability("cards", "Credit card dues", 0),
    liability("otherLiabilities", "Other liabilities", 0),
    inr("expenses", "Monthly expenses", 1_000, 1e7, 50_000, { section: "Cash flow" }),
  ],
  compute: (v) => {
    const assets = ASSET_KEYS.reduce((s, k) => s + num(v, k), 0);
    const liabilities = LIABILITY_KEYS.reduce((s, k) => s + num(v, k), 0);
    return {
      primary: { label: "Net worth", value: assets - liabilities, format: "inr" },
      groups: [
        {
          items: [
            { label: "Total assets", value: assets, format: "inr" },
            { label: "Total liabilities", value: liabilities, format: "inr" },
          ],
        },
        {
          title: "Ratios",
          items: [
            {
              label: "Emergency cover (cash ÷ monthly expenses)",
              value: `${(num(v, "cash") / num(v, "expenses")).toFixed(1)} months`,
              format: "text",
            },
            {
              label: "Debt to assets",
              value: assets > 0 ? (liabilities / assets) * 100 : 0,
              format: "pct",
            },
          ],
        },
      ],
      split:
        assets + liabilities > 0
          ? [
              { label: "Assets", value: assets, format: "inr" },
              { label: "Liabilities", value: liabilities, format: "inr" },
            ]
          : undefined,
    };
  },
};
