export type CalculatorCategory =
  | "SIP"
  | "Lump Sum"
  | "Goal Planning"
  | "Withdrawal"
  | "Tax-Advantaged Savings"
  | "Loans"
  | "Allocation, Tax & Protection"
  | "Wealth Snapshot";

export type Calculator = {
  slug: string;
  name: string;
  category: CalculatorCategory;
  description: string;
};

// The 26 calculators from tools.md §6, in the site's original order.
export const calculators: Calculator[] = [
  {
    slug: "become-a-crorepati",
    name: "Become a Crorepati",
    category: "SIP",
    description:
      "Monthly SIP needed to reach a wealth target after inflation and growth on existing savings.",
  },
  {
    slug: "sip-calculator",
    name: "Systematic Investment Plan Calculator",
    category: "SIP",
    description: "What a fixed monthly SIP grows to over time.",
  },
  {
    slug: "sip-step-up-calculator",
    name: "Mutual Fund SIP Calculator Step Up",
    category: "SIP",
    description: "Compare a flat SIP against one that rises by a fixed percentage every year.",
  },
  {
    slug: "goal-based-top-up-sip",
    name: "Goal Based Top Up SIP",
    category: "SIP",
    description: "Starting SIP needed for a goal when the SIP rises each year.",
  },
  {
    slug: "target-amount-sip-calculator",
    name: "Target Amount SIP Calculator",
    category: "SIP",
    description: "SIP needed to hit a target amount in N years, with inflation applied.",
  },
  {
    slug: "sip-with-annual-increase",
    name: "SIP with Annual Increase",
    category: "SIP",
    description: "Project a SIP whose instalment is enhanced every year.",
  },
  {
    slug: "ppf-calculator",
    name: "Public Provident Fund (PPF) Calculator",
    category: "Tax-Advantaged Savings",
    description: "Maturity value of yearly PPF deposits over a 15+ year tenure.",
  },
  {
    slug: "epf-calculator",
    name: "Employees Provident Fund Calculator",
    category: "Tax-Advantaged Savings",
    description: "Retirement corpus built from employee and employer EPF contributions.",
  },
  {
    slug: "swp-calculator",
    name: "SWP Calculator",
    category: "Withdrawal",
    description: "How long a corpus lasts under a fixed monthly withdrawal.",
  },
  {
    slug: "retirement-planning-calculator",
    name: "Retirement Planning Calculator",
    category: "Goal Planning",
    description: "SIP needed to build a retirement corpus stated in today's money.",
  },
  {
    slug: "asset-allocation",
    name: "Asset Allocation",
    category: "Allocation, Tax & Protection",
    description: "Split money between equity, debt and gold by risk profile.",
  },
  {
    slug: "home-loan-emi-calculator",
    name: "Home Loan EMI Calculator",
    category: "Loans",
    description: "Monthly EMI, total interest and repayment schedule for a home loan.",
  },
  {
    slug: "personal-loan-emi-calculator",
    name: "Personal Loan EMI Calculator",
    category: "Loans",
    description: "Monthly EMI, total interest and repayment schedule for a personal loan.",
  },
  {
    slug: "car-loan-emi-calculator",
    name: "Car Loan EMI Calculator",
    category: "Loans",
    description: "Monthly EMI, total interest and repayment schedule for a car loan.",
  },
  {
    slug: "education-loan-emi-calculator",
    name: "Education Loan EMI Calculator",
    category: "Loans",
    description: "Monthly EMI, total interest and repayment schedule for an education loan.",
  },
  {
    slug: "goal-setting-calculator",
    name: "Goal Setting Calculator",
    category: "Goal Planning",
    description: "SIP needed to afford a dream purchase after N years.",
  },
  {
    slug: "composite-financial-goal-planner",
    name: "Composite Financial Goal Planner",
    category: "Goal Planning",
    description: "Plan several goals at once and get the combined monthly saving.",
  },
  {
    slug: "cost-inflation-index",
    name: "Cost Inflation Index",
    category: "Allocation, Tax & Protection",
    description: "Index an asset's purchase price for inflation to compute capital gains.",
  },
  {
    slug: "compounding-calculator",
    name: "Compounding Calculator",
    category: "Lump Sum",
    description: "See how compounding frequency changes growth.",
  },
  {
    slug: "spending-less-calculator",
    name: "Spending Less Calculator",
    category: "Lump Sum",
    description: "Wealth built by investing small recurring expenses instead.",
  },
  {
    slug: "future-value-inflation-calculator",
    name: "Future Value Inflation Calculator",
    category: "Lump Sum",
    description: "What today's cost becomes in the future after inflation.",
  },
  {
    slug: "human-life-value-calculator",
    name: "Human Life Value Calculator",
    category: "Allocation, Tax & Protection",
    description: "Life cover your family needs to replace your income.",
  },
  {
    slug: "lumpsum-target-calculator",
    name: "Lumpsum Target Calculator",
    category: "Lump Sum",
    description: "One-time amount to invest today to reach a future target.",
  },
  {
    slug: "lumpsum-calculator",
    name: "Lumpsum Calculator",
    category: "Lump Sum",
    description: "Growth of a one-time investment.",
  },
  {
    slug: "children-education-planner",
    name: "Children Education Planner",
    category: "Goal Planning",
    description: "Future cost of a child's education and the SIP to fund it.",
  },
  {
    slug: "net-worth-calculator",
    name: "Net Worth Calculator",
    category: "Wealth Snapshot",
    description: "What you own minus what you owe.",
  },
];

export const categoryOrder: CalculatorCategory[] = [
  "SIP",
  "Lump Sum",
  "Goal Planning",
  "Withdrawal",
  "Tax-Advantaged Savings",
  "Loans",
  "Allocation, Tax & Protection",
  "Wealth Snapshot",
];

/** Badge color per category, cycling through the palette's three solid tones. */
export type Tone = "fill" | "soft" | "ink";

export const categoryTone: Record<CalculatorCategory, Tone> = {
  SIP: "fill",
  "Lump Sum": "soft",
  "Goal Planning": "ink",
  Withdrawal: "fill",
  "Tax-Advantaged Savings": "soft",
  Loans: "ink",
  "Allocation, Tax & Protection": "fill",
  "Wealth Snapshot": "soft",
};

export function getCalculator(slug: string): Calculator | undefined {
  return calculators.find((c) => c.slug === slug);
}

export function calculatorsByCategory() {
  return categoryOrder.map((category) => ({
    category,
    items: calculators.filter((c) => c.category === category),
  }));
}
