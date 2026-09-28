import { effMonthly, fvLump, sipForTarget } from "../finance/engines";

export type Goal = { id: number; name: string; cost: number; years: number; inflation: number };

export type GoalPlan = Goal & { futureCost: number; sip: number };

/**
 * Solve each goal separately, since each has its own horizon (tools.md §3.3 #13),
 * then add up the SIPs.
 */
export function planGoals(goals: Goal[], returnPct: number) {
  const i = effMonthly(returnPct / 100);
  const plans: GoalPlan[] = goals.map((g) => {
    const futureCost = fvLump(g.cost, g.inflation / 100, g.years);
    return { ...g, futureCost, sip: g.years > 0 ? sipForTarget(futureCost, g.years * 12, i, true) : 0 };
  });
  return {
    plans,
    totalSip: plans.reduce((s, p) => s + p.sip, 0),
    totalToday: plans.reduce((s, p) => s + p.cost, 0),
    totalFuture: plans.reduce((s, p) => s + p.futureCost, 0),
  };
}

export const DEFAULT_GOALS: Goal[] = [
  { id: 1, name: "Child's education", cost: 25_00_000, years: 12, inflation: 10 },
  { id: 2, name: "House down payment", cost: 20_00_000, years: 7, inflation: 6 },
  { id: 3, name: "Family holiday", cost: 3_00_000, years: 3, inflation: 6 },
];
