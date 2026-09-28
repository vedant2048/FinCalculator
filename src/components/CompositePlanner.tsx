"use client";

import { useId, useMemo, useState } from "react";
import { DEFAULT_GOALS, planGoals, type Goal } from "@/lib/defs/composite";
import { inr, pct, years, type NumberField } from "@/lib/defs/types";
import { formatINR } from "@/lib/format";
import { NumberInput, validateNumber } from "./fields";
import { DataTable, Notes, ResultPanel } from "./results";

const costField = inr("cost", "Cost today", 10_000, 1e9, 10_00_000);
const yearsField = years("years", "Years away", 1, 40, 5);
const inflationField = pct("inflation", "Inflation for this goal", 0, 20, 6);
const returnField = pct("return", "Expected return on your SIPs", 1, 25, 12);
const MAX_GOALS = 10;

type RawGoal = { id: number; name: string; cost: string; years: string; inflation: string };

const toRaw = (g: Goal): RawGoal => ({
  id: g.id,
  name: g.name,
  cost: String(g.cost),
  years: String(g.years),
  inflation: String(g.inflation),
});

const invalid = (f: NumberField, raw: string) => validateNumber(f, raw) !== null;

export function CompositePlanner() {
  const [goals, setGoals] = useState<RawGoal[]>(() => DEFAULT_GOALS.map(toRaw));
  const [returnRaw, setReturnRaw] = useState(String(returnField.default));
  const nameId = useId();

  const plan = useMemo(() => {
    if (invalid(returnField, returnRaw) || goals.length === 0) return null;
    if (
      goals.some(
        (g) => invalid(costField, g.cost) || invalid(yearsField, g.years) || invalid(inflationField, g.inflation),
      )
    ) {
      return null;
    }
    return planGoals(
      goals.map((g) => ({
        id: g.id,
        name: g.name.trim() || "Untitled goal",
        cost: Number(g.cost),
        years: Number(g.years),
        inflation: Number(g.inflation),
      })),
      Number(returnRaw),
    );
  }, [goals, returnRaw]);

  const update = (id: number, patch: Partial<RawGoal>) =>
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const addGoal = () =>
    setGoals((gs) => [
      ...gs,
      toRaw({
        id: Math.max(0, ...gs.map((g) => g.id)) + 1,
        name: `Goal ${gs.length + 1}`,
        cost: costField.default,
        years: yearsField.default,
        inflation: inflationField.default,
      }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section className="neu-raised rounded-3xl p-5 sm:p-6">
            <NumberInput field={returnField} raw={returnRaw} onChange={setReturnRaw} />
          </section>

          {goals.map((g, idx) => (
            <section key={g.id} className="neu-raised flex flex-col gap-5 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <label htmlFor={`${nameId}-${g.id}`} className="sr-only">
                  Goal {idx + 1} name
                </label>
                <input
                  id={`${nameId}-${g.id}`}
                  value={g.name}
                  onChange={(e) => update(g.id, { name: e.target.value })}
                  className="neu-field min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))}
                  disabled={goals.length === 1}
                  aria-label={`Remove ${g.name || `goal ${idx + 1}`}`}
                  className="neu-button rounded-xl px-3 py-2 text-sm text-muted disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <NumberInput field={costField} raw={g.cost} onChange={(cost) => update(g.id, { cost })} />
              <NumberInput field={yearsField} raw={g.years} onChange={(y) => update(g.id, { years: y })} />
              <NumberInput
                field={inflationField}
                raw={g.inflation}
                onChange={(inflation) => update(g.id, { inflation })}
              />
            </section>
          ))}

          <button
            type="button"
            onClick={addGoal}
            disabled={goals.length >= MAX_GOALS}
            className="neu-button-fill rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-40"
          >
            + Add goal
          </button>
        </div>

        <section aria-live="polite" className="neu-raised h-fit rounded-3xl p-5 sm:p-6 lg:sticky lg:top-6">
          <ResultPanel
            result={
              plan && {
                primary: { label: "Total monthly SIP", value: plan.totalSip, format: "inr" },
                groups: [
                  {
                    title: "SIP per goal",
                    items: plan.plans.map((p) => ({
                      label: p.name,
                      value: formatINR(p.sip),
                      format: "text" as const,
                    })),
                  },
                  {
                    items: [
                      { label: "Goals at today's cost", value: plan.totalToday, format: "inr" },
                      { label: "Goals at future cost", value: plan.totalFuture, format: "inr" },
                    ],
                  },
                ],
              }
            }
          />
        </section>
      </div>

      {plan && (
        <DataTable
          table={{
            caption: "Goal breakdown",
            columns: [
              { label: "Goal", format: "text" },
              { label: "Years", format: "number" },
              { label: "Cost today", format: "inr" },
              { label: "Future cost", format: "inr" },
              { label: "Monthly SIP", format: "inr" },
            ],
            rows: plan.plans.map((p) => [p.name, p.years, p.cost, p.futureCost, p.sip]),
          }}
        />
      )}

      <Notes
        notes={[
          "Each goal gets its own SIP, sized for its own horizon, and the SIPs are added up. A goal's SIP stops once that goal is reached.",
        ]}
      />
    </div>
  );
}
