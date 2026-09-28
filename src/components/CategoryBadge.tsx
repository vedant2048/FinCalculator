import { categoryTone, type CalculatorCategory, type Tone } from "@/lib/calculators";

const TONE_CLASS: Record<Tone, string> = {
  fill: "bg-fill text-on-fill",
  soft: "bg-fill-soft text-on-fill",
  ink: "bg-ink text-on-ink",
};

const ICON_PATHS: Record<CalculatorCategory, React.ReactNode> = {
  SIP: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />,
  "Lump Sum": <path d="M12 3l8 9-8 9-8-9z" />,
  "Goal Planning": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  Withdrawal: <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />,
  "Tax-Advantaged Savings": <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  Loans: <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-5h4v5" />,
  "Allocation, Tax & Protection": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5V12h8.5" />
    </>
  ),
  "Wealth Snapshot": <path d="M5 20V11M12 20V4M19 20v-6" />,
};

export function CategoryIcon({
  category,
  size = "md",
}: {
  category: CalculatorCategory;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      aria-hidden
      className={`neu-shadow-sm flex shrink-0 items-center justify-center ${box} ${TONE_CLASS[categoryTone[category]]}`}
    >
      <svg
        className={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICON_PATHS[category]}
      </svg>
    </span>
  );
}

export function CategoryChip({ category }: { category: CalculatorCategory }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASS[categoryTone[category]]}`}
    >
      {category}
    </span>
  );
}
