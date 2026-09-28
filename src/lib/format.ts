const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const numFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** ₹ with Indian digit grouping: ₹1,00,00,000. */
export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  const rounded = Math.round(value);
  // Avoid "-₹0" from tiny negative float noise.
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  return `${safe < 0 ? "-" : ""}₹${inrFormatter.format(Math.abs(safe))}`;
}

/** Short lakh/crore form for hints: ₹2.16 Cr, ₹34.24 L. */
export function formatCompactINR(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${numFormatter.format(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${numFormatter.format(abs / 1e5)} L`;
  return formatINR(value);
}

export function formatNumber(value: number): string {
  return numFormatter.format(value);
}

export function formatPct(value: number): string {
  return `${numFormatter.format(value)}%`;
}

export function formatYears(value: number): string {
  return `${numFormatter.format(value)} ${value === 1 ? "year" : "years"}`;
}

export function formatMonths(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  const total = Math.floor(value);
  const y = Math.floor(total / 12);
  const m = total % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y === 1 ? "" : "s"}`);
  if (m || !y) parts.push(`${m} mo${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}
