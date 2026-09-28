import { describe, expect, it } from "vitest";
import { calculators } from "../calculators";
import { DEFAULT_GOALS, planGoals } from "./composite";
import { definitions } from "./index";
import type { Result, Values } from "./types";

const defaults = (slug: string): Values => {
  const def = definitions[slug];
  if (def === "composite") throw new Error("composite has no fields");
  return Object.fromEntries(def.fields.map((f) => [f.key, f.default]));
};

function allNumbers(result: Result): number[] {
  if ("error" in result) return [];
  const outs = [result.primary, ...result.groups.flatMap((g) => g.items), ...(result.split ?? [])];
  const cells = result.table?.rows.flat() ?? [];
  return [...outs.map((o) => o.value), ...cells].filter((x): x is number => typeof x === "number");
}

describe("calculator definitions", () => {
  it("covers every listed calculator", () => {
    expect(Object.keys(definitions).sort()).toEqual(calculators.map((c) => c.slug).sort());
  });

  for (const { slug } of calculators) {
    if (definitions[slug] === "composite") continue;
    it(`${slug} computes finite results from its defaults`, () => {
      const def = definitions[slug];
      if (def === "composite") return;
      for (const f of def.fields) {
        if (f.kind === "number") {
          expect(f.default).toBeGreaterThanOrEqual(f.min);
          expect(f.default).toBeLessThanOrEqual(f.max);
        } else {
          expect(f.options.map((o) => o.value)).toContain(f.default);
        }
      }
      const result = def.compute(defaults(slug));
      expect(result).not.toHaveProperty("error");
      for (const n of allNumbers(result)) expect(Number.isNaN(n)).toBe(false);
    });
  }

  it("composite planner sums per-goal SIPs", () => {
    const plan = planGoals(DEFAULT_GOALS, 12);
    expect(plan.totalSip).toBeCloseTo(plan.plans.reduce((s, p) => s + p.sip, 0), 8);
    expect(plan.plans.every((p) => p.sip > 0)).toBe(true);
  });

  it("goal calculators report V1 through the UI layer", () => {
    const def = definitions["retirement-planning-calculator"];
    if (def === "composite") throw new Error();
    const r = def.compute({ goal: 50_00_000, age: 30, targetAge: 60, inflation: 5, return: 12.5, savings: 1_00_000 });
    if ("error" in r) throw new Error(r.error);
    expect(Math.round(r.primary.value as number)).toBe(5343);
  });

  it("validation errors surface instead of NaN", () => {
    const def = definitions["become-a-crorepati"];
    if (def === "composite") throw new Error();
    expect(def.compute({ ...defaults("become-a-crorepati"), targetAge: 30 })).toHaveProperty("error");
  });
});
