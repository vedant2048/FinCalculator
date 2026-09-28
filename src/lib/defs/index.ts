import { becomeACrorepati, childrenEducation, goalSetting, retirementPlanning, targetAmountSip } from "./goals";
import { carLoanEmi, educationLoanEmi, homeLoanEmi, personalLoanEmi } from "./loans";
import { compounding, futureValueInflation, lumpsum, lumpsumTarget } from "./lumpsum";
import { assetAllocation, costInflationIndex, humanLifeValue, netWorth } from "./misc";
import { epf, ppf, swp } from "./savings";
import { goalTopUpSip, sipCalculator, sipStepUp, sipWithAnnualIncrease, spendingLess } from "./sip";
import type { CalculatorDef } from "./types";

/** Slug -> definition. "composite" has its own UI (multiple goals). */
export const definitions: Record<string, CalculatorDef | "composite"> = {
  "become-a-crorepati": becomeACrorepati,
  "sip-calculator": sipCalculator,
  "sip-step-up-calculator": sipStepUp,
  "goal-based-top-up-sip": goalTopUpSip,
  "target-amount-sip-calculator": targetAmountSip,
  "sip-with-annual-increase": sipWithAnnualIncrease,
  "ppf-calculator": ppf,
  "epf-calculator": epf,
  "swp-calculator": swp,
  "retirement-planning-calculator": retirementPlanning,
  "asset-allocation": assetAllocation,
  "home-loan-emi-calculator": homeLoanEmi,
  "personal-loan-emi-calculator": personalLoanEmi,
  "car-loan-emi-calculator": carLoanEmi,
  "education-loan-emi-calculator": educationLoanEmi,
  "goal-setting-calculator": goalSetting,
  "composite-financial-goal-planner": "composite",
  "cost-inflation-index": costInflationIndex,
  "compounding-calculator": compounding,
  "spending-less-calculator": spendingLess,
  "future-value-inflation-calculator": futureValueInflation,
  "human-life-value-calculator": humanLifeValue,
  "lumpsum-target-calculator": lumpsumTarget,
  "lumpsum-calculator": lumpsum,
  "children-education-planner": childrenEducation,
  "net-worth-calculator": netWorth,
};
