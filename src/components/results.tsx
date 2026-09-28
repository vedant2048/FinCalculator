import type { Format, Output, Result, Table } from "@/lib/defs/types";
import { formatINR, formatMonths, formatNumber, formatPct, formatYears } from "@/lib/format";

export function formatValue(value: number | string, format: Format): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "inr":
      return formatINR(value);
    case "pct":
      return formatPct(value);
    case "years":
      return formatYears(value);
    case "months":
      return formatMonths(value);
    default:
      return formatNumber(value);
  }
}

function SplitBar({ split }: { split: [Output, Output] }) {
  const [a, b] = split.map((o) => Math.max(0, Number(o.value)));
  const total = a + b;
  const aPct = total > 0 ? (a / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="neu-inset flex h-3 overflow-hidden rounded-full p-0.5">
        <div className="h-full rounded-full bg-fill" style={{ width: `${aPct}%` }} />
        <div className="h-full rounded-full bg-fill-soft" style={{ width: `${100 - aPct}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fill" />
          {split[0].label} · {aPct.toFixed(0)}%
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fill-soft" />
          {split[1].label} · {(100 - aPct).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function ResultPanel({ result }: { result: Result | null }) {
  if (!result) {
    return (
      <div className="neu-inset rounded-2xl p-6 text-sm text-muted">
        Fix the highlighted inputs to see results.
      </div>
    );
  }
  if ("error" in result) {
    return (
      <div role="alert" className="neu-inset rounded-2xl p-6 text-sm text-danger">
        {result.error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="neu-shadow flex flex-col gap-1 rounded-2xl bg-fill-soft p-5 text-on-fill">
        <span className="text-sm font-medium opacity-80">{result.primary.label}</span>
        <output className="text-3xl font-bold tracking-tight tabular-nums">
          {formatValue(result.primary.value, result.primary.format)}
        </output>
      </div>

      {result.message && <p className="text-sm leading-relaxed text-muted">{result.message}</p>}

      {result.split && <SplitBar split={result.split} />}

      {result.groups.map((group, gi) => (
        <dl key={gi} className="flex flex-col gap-2.5">
          {group.title && (
            <dt className="text-xs font-semibold uppercase tracking-wider text-accent">{group.title}</dt>
          )}
          {group.items.map((item) => (
            <div key={item.label} className="flex items-baseline justify-between gap-4 text-sm">
              <dt className="text-muted">{item.label}</dt>
              <dd className="text-right font-medium tabular-nums">
                {formatValue(item.value, item.format)}
              </dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}

export function DataTable({ table }: { table: Table }) {
  return (
    <section className="neu-raised flex flex-col gap-4 rounded-3xl p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">{table.caption}</h2>
      <div className="neu-inset max-h-96 overflow-auto rounded-2xl">
        <table className="w-full min-w-md text-sm tabular-nums">
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th
                  key={c.label}
                  scope="col"
                  className={`sticky top-0 bg-surface px-4 py-3 font-semibold text-accent ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="even:bg-surface-2">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-2 ${ci === 0 ? "text-left" : "text-right"}`}>
                    {formatValue(cell, table.columns[ci].format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Notes({ notes }: { notes?: string[] }) {
  return (
    <section className="flex flex-col gap-2 text-xs leading-relaxed text-muted">
      {notes?.map((n) => <p key={n}>{n}</p>)}
      <p>
        Projections assume a constant rate of return and ignore market volatility, sequence risk
        and tax on gains. They are illustrative, not financial advice.
      </p>
    </section>
  );
}
