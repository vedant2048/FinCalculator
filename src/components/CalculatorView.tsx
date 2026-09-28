"use client";

import { useMemo, useState } from "react";
import { definitions } from "@/lib/defs";
import type { CalculatorDef, Field, Values } from "@/lib/defs/types";
import { CompositePlanner } from "./CompositePlanner";
import { NumberInput, SelectInput, validateNumber } from "./fields";
import { DataTable, Notes, ResultPanel } from "./results";

export function CalculatorView({ slug }: { slug: string }) {
  const def = definitions[slug];
  if (!def) return null;
  if (def === "composite") return <CompositePlanner />;
  return <FieldCalculator def={def} />;
}

function groupBySection(fields: Field[]) {
  const sections: { title?: string; fields: Field[] }[] = [];
  for (const f of fields) {
    const last = sections.at(-1);
    if (last && last.title === f.section) last.fields.push(f);
    else sections.push({ title: f.section, fields: [f] });
  }
  return sections;
}

function FieldCalculator({ def }: { def: CalculatorDef }) {
  const [raw, setRaw] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.fields.map((f) => [f.key, String(f.default)])),
  );

  const result = useMemo(() => {
    const values: Values = {};
    for (const f of def.fields) {
      if (f.kind === "number") {
        if (validateNumber(f, raw[f.key])) return null;
        values[f.key] = Number(raw[f.key]);
      } else {
        values[f.key] = raw[f.key];
      }
    }
    return def.compute(values);
  }, [def, raw]);

  const set = (key: string) => (value: string) => setRaw((r) => ({ ...r, [key]: value }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="neu-raised flex flex-col gap-6 rounded-3xl p-5 sm:p-6">
          {groupBySection(def.fields).map((section, i) => (
            <fieldset key={i} className="flex flex-col gap-5">
              {section.title && (
                <legend className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
                  {section.title}
                </legend>
              )}
              {section.fields.map((f) =>
                f.kind === "number" ? (
                  <NumberInput key={f.key} field={f} raw={raw[f.key]} onChange={set(f.key)} />
                ) : (
                  <SelectInput key={f.key} field={f} value={raw[f.key]} onChange={set(f.key)} />
                ),
              )}
            </fieldset>
          ))}
        </section>

        <section
          aria-live="polite"
          className="neu-raised h-fit rounded-3xl p-5 sm:p-6 lg:sticky lg:top-6"
        >
          <ResultPanel result={result} />
        </section>
      </div>

      {result && "table" in result && result.table && <DataTable table={result.table} />}

      <Notes notes={def.notes} />
    </div>
  );
}
