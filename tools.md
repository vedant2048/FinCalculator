# tools.md — Financial Calculators Reference

Reference spec for building the 26 calculators found on Advisorkhoj's "Tools & Calculators" menu. Written so Claude Code can implement them from this file alone: concept first, then inputs, formulas, edge cases and test vectors.

## 0. How to read this file

**Confidence legend.** Every calculator carries a status. Do not treat unverified logic as the site's own.

| Tag | Meaning |
|---|---|
| ✅ VERIFIED | Page was read in full, and formulas were checked against real site outputs. |
| ◐ LABELS | Input/output labels were seen on the page. Formulas are standard finance, inferred from those labels. |
| ○ STANDARD | Only the name is known. Logic is textbook finance and is a design choice, not the site's confirmed behaviour. |

**Rule of thumb:** most of the 26 calculators are the same 3 engines with different labels (Section 2). Build the engines once, test them hard, then wrap them.

**Currency and units**
- All money is INR (₹). Display with Indian digit grouping: `1,00,000` (lakh), `1,00,00,000` (crore).
- 1 lakh = 100,000. 1 crore = 10,000,000.
- Rates are entered as annual percentages (12.5 means 12.5% p.a.). Convert to decimals internally (0.125).
- Round for display only. Never round intermediate values.

---

## 1. Core concepts (read before the formulas)

**Compounding.** Money earns returns, and those returns earn returns. ₹1 at 10% becomes ₹1.10 after a year, ₹1.21 after two. Formula: `FV = PV × (1 + r)^n`.

**Inflation.** Prices rise, so a fixed goal costs more later. A ₹50L goal in today's money costs `50L × (1 + inflation)^years` in future rupees. Inflation-adjusting the goal (not the investments) is what most goal calculators do.

**SIP (Systematic Investment Plan).** A fixed amount invested every month. Each instalment compounds for a different length of time, so the total is a sum of many small compounding pieces. This sum has a closed form, the **annuity formula** (Engine 2).

**Annuity due vs ordinary annuity.** If the instalment is invested at the start of each month it is an *annuity due* and earns one extra month of growth (multiply by `1 + i`). At the end of each month it is an *ordinary annuity* (no extra factor).

**Nominal vs effective monthly rate.** Two ways to turn an annual rate into a monthly one:
- Nominal: `i = r / 12`. Simple division. Slightly overstates growth.
- Effective: `i = (1 + r)^(1/12) − 1`. Compounds to exactly `r` over 12 months.

**Solving in reverse.** "How much must I invest monthly to reach ₹X?" is the annuity formula rearranged: `SIP = Target / annuity_factor`.

---

## 2. Core engines (implement these once)

Reference implementation in Python. It is language-neutral, so port it to the project's stack. These functions were run against real site outputs (Section 5).

```python
import math

def eff_monthly(annual_rate):
    """Effective monthly rate from annual decimal rate (0.125 -> 0.0098636)."""
    return (1 + annual_rate) ** (1 / 12) - 1

def fv_lump(pv, annual_rate, years):
    """Engine 1: lump sum growth. Also used for inflation (rate = inflation)."""
    return pv * (1 + annual_rate) ** years

def pv_lump(fv, annual_rate, years):
    """Inverse of Engine 1."""
    return fv / (1 + annual_rate) ** years

def sip_fv(payment, months, i, due=True):
    """Engine 2: future value of a fixed monthly SIP.
    i = monthly rate (decimal). due=True -> invested at start of month."""
    if i == 0:
        return payment * months
    factor = ((1 + i) ** months - 1) / i
    return payment * factor * ((1 + i) if due else 1)

def sip_for_target(target, months, i, due=True):
    """Engine 3: monthly SIP needed to reach `target` (inverse of Engine 2)."""
    return target / sip_fv(1, months, i, due)

def stepup_sip_fv(start_payment, months, i, step_annual):
    """Step-up SIP: instalment rises by step_annual (decimal) every 12 months.
    Returns (total_invested, future_value). Start-of-month payments."""
    bal, cur, invested = 0.0, start_payment, 0.0
    for m in range(1, months + 1):
        bal = (bal + cur) * (1 + i)
        invested += cur
        if m % 12 == 0:
            cur *= (1 + step_annual)
    return invested, bal

def emi(principal, annual_rate_pct, months):
    r = annual_rate_pct / 12 / 100
    if r == 0:
        return principal / months
    return principal * r * (1 + r) ** months / ((1 + r) ** months - 1)

def swp_months(balance, withdrawal, i):
    """Months a corpus lasts under a fixed monthly withdrawal (monthly rate i).
    Returns math.inf if withdrawals never exhaust it (growth >= withdrawal)."""
    if balance * i >= withdrawal:
        return math.inf
    return -math.log(1 - balance * i / withdrawal) / math.log(1 + i)
```

### The three engines in plain words

| Engine | Question it answers | Formula |
|---|---|---|
| E1 Lump sum | What does one amount become? | `FV = PV × (1 + r)^n` |
| E2 SIP forward | What does a monthly SIP become? | `FV = P × [((1+i)^m − 1) / i] × (1+i)` |
| E3 SIP reverse | What monthly SIP hits a target? | `P = Target / [((1+i)^m − 1)/i × (1+i)]` |

### The goal-solver recipe (used by most calculators)

Many calculators run the same six steps. Implement it once as `goal_sip(...)`:

```
1. years            = target_age − current_age               (or given directly)
2. inflated_goal    = goal_today × (1 + inflation)^years      # E1 with inflation
3. savings_grown    = existing_savings × (1 + return)^years   # E1 with return
4. final_target     = max(0, inflated_goal − savings_grown)
5. i                = (1 + return)^(1/12) − 1                 # EFFECTIVE monthly
6. monthly_sip      = final_target / annuity_due_factor(months = years×12, i)
   total_invested   = monthly_sip × months
   total_growth     = final_target − total_invested
```

Two quirks to preserve (both confirmed against live output):
- The site labels step 3 "Growth of your savings" but the number is the **future value** of the savings (principal + growth), not the growth alone.
- The goal-solver uses the **effective** monthly rate and **start-of-month** payments.

---

## 3. Calculator catalog

### 3.1 SIP family

#### 1) Become a Crorepati ✅ VERIFIED
- **Concept:** How much must I save monthly to reach a wealth target, after inflation and after counting growth on existing savings?
- **Inputs:** wealth target in today's ₹ (1–100 Cr), current age (10–100), target age (10–100), inflation (0–10%), expected SIP return (5–20%), current savings (0–1 Cr).
- **Outputs:** inflation-adjusted target, growth of savings, final targeted amount, years to save, monthly SIP required, total invested, total growth.
- **Logic:** goal-solver recipe (Section 2).

#### 2) Systematic Investment Plan Calculator ✅ VERIFIED
- **Concept:** What will a fixed monthly SIP grow to?
- **Inputs:** monthly SIP (slider up to ₹1 Cr), months (0–999), expected return (5–20% p.a.).
- **Outputs:** total invested, total growth, total future value (invested + growth). The page also shows a schedule from a chosen start date.
- **Logic:** `sip_fv(P, months, r/12, due)` using the **nominal** monthly rate `r/12`.
- **Known ambiguity:** two saved site outputs disagree on payment timing. One matches start-of-month, the other end-of-month (see Section 5). Expose `due` as a config flag. Default `due=True`, and confirm against the live page.

#### 3) Mutual Fund SIP Calculator Step Up ✅ VERIFIED (inputs), ◐ (logic)
- **Concept:** Compare a flat SIP against one that grows by a fixed percentage every year.
- **Inputs:** monthly SIP, months (0–999), return (5–20%), step-up (0–60% p.a.).
- **Outputs:** two columns: invested, growth and future value *without* step-up, and the same *with* step-up.
- **Logic:** `sip_fv` for the flat case, `stepup_sip_fv` for the step-up case. Instalment rises once every 12 months (inferred from the "% per annum" label).

#### 4) Goal-based Top-Up SIP ◐ LABELS
- **Concept:** Starting SIP needed for a goal when the SIP rises by a fixed % each year. A lower start than a flat SIP, because later instalments are larger.
- **Inputs:** goal (₹1L–100 Cr), investment period in years (0–100), return (0–25%), inflation (0–25%), SIP top-up (0–100% p.a.).
- **Outputs (5 values seen):** likely starting monthly SIP, inflation-adjusted goal, years, total invested, growth.
- **Logic (inferred):** `inflated_goal = goal × (1+inf)^years`. Then find the starting SIP `P` such that `stepup_sip_fv(P, years×12, i, top_up).fv = inflated_goal`. Because the FV is linear in `P`, compute FV for `P = 1` and divide: `P = inflated_goal / stepup_sip_fv(1, ...).fv`.

#### 5) Target Amount SIP Calculator ◐ LABELS
- **Concept:** SIP needed to hit a target amount in N years, with inflation applied.
- **Inputs:** target (₹1L–100 Cr), period in years (0–100), inflation (0–10%), SIP return (0–25%).
- **Outputs:** inflated target, years, monthly SIP, total invested, growth (inferred order).
- **Logic:** goal-solver recipe with `existing_savings = 0`.

#### 6) SIP with Annual Increase ◐ LABELS
- **Concept:** Same idea as step-up, but on the site's MF-research tool it runs on **real historical NAV data** for a chosen scheme, not an assumed return.
- **Inputs:** scheme, instalment, frequency (fortnightly, monthly, quarterly), start and end date, yearly enhancement (5–100%).
- **Logic:** replay historical NAVs: `units += instalment / NAV_on_date`. Value = `units × latest NAV`. Report XIRR. Needs a NAV data source.
- **Build note:** a projection-only version is the step-up SIP (#3). Only build the NAV-driven version if you have NAV data.

### 3.2 Lump sum family

#### 7) Lumpsum Calculator ○ STANDARD
- **Concept:** Growth of a one-time investment.
- **Logic:** `FV = P × (1 + r)^n`. Growth = `FV − P`.

#### 8) Lumpsum Target Calculator ○ STANDARD
- **Concept:** How much to invest *today* in one go to reach a future target.
- **Logic:** `P = Target / (1 + r)^n`. If the tool inflates the target first: `Target_future = Target_today × (1 + inflation)^n`.

#### 9) Compounding Calculator ○ STANDARD
- **Concept:** Show how compounding frequency changes growth.
- **Logic:** `FV = P × (1 + r/m)^(m×t)` where `m` = compounding periods per year (1, 2, 4, 12, 365). Effective annual rate = `(1 + r/m)^m − 1`.

#### 10) Future Value Inflation Calculator ◐ LABELS
- **Concept:** What today's cost becomes in the future.
- **Logic:** `FV = PV × (1 + inflation)^n`. Reverse (purchasing power): `real_value = amount / (1 + inflation)^n`.

#### 11) Spending Less Calculator ○ STANDARD
- **Concept:** Show how much wealth builds if small recurring expenses are invested instead.
- **Logic (assumed):** treat the saved amount as a monthly SIP and use `sip_fv(saving, months, i)`. Confirm the site's exact treatment before finalizing.

### 3.3 Goal planning

#### 12) Goal Setting Calculator ◐ LABELS
- **Concept:** SIP needed to afford a dream purchase (car, holiday, house) after N years.
- **Inputs seen:** amount to spend (₹1–100 Cr), years away. Likely also inflation and return (labels truncated).
- **Logic:** goal-solver recipe with no existing savings.

#### 13) Composite Financial Goal Planner ◐ LABELS
- **Concept:** Plan several goals at once (child's education, a house, a holiday) and get the combined monthly saving.
- **Inputs seen:** cost of each goal at today's prices.
- **Logic (inferred):** for each goal `g`, `future_cost_g = cost_g × (1 + inflation_g)^years_g`. Solve `sip_for_target(future_cost_g, years_g × 12, i)` per goal. `total_sip = Σ sip_g`. Because each goal has its own horizon, do not sum future costs and solve once.

#### 14) Children Education Planner ○ STANDARD
- **Concept:** Future cost of a child's education and the SIP to fund it.
- **Inputs:** current cost, education inflation (often higher than general inflation), years until needed, expected return, existing savings.
- **Logic:** goal-solver recipe.

#### 15) Retirement Planning Calculator ✅ VERIFIED
- **Concept:** SIP needed to build a retirement corpus stated in today's money.
- **Inputs:** corpus wanted in today's ₹ (₹50L–10 Cr), current age, retirement age, inflation (5–15%), return (5–20%), current savings (₹50L–10 Cr slider).
- **Outputs:** monthly SIP, total invested through SIP, total growth, retirement amount (inflation adjusted), growth of savings, final targeted amount.
- **Logic:** goal-solver recipe. Fully reproduced in Section 5, vector V1.
- **Limitation:** this tool builds the corpus but does not model post-retirement withdrawals. Pair it with SWP (#17) for that.

#### Shared engine note: Crorepati, Retirement, Target Amount, Goal Setting and Children Education
These share one engine. Implement `goal_sip()` once and expose five thin wrappers that differ only in labels, default values and slider ranges.

### 3.4 Withdrawal

#### 17) SWP Calculator ○ STANDARD
- **Concept:** Systematic Withdrawal Plan. Withdraw a fixed amount monthly from a corpus that keeps earning returns. Shows how long it lasts.
- **Inputs:** starting corpus, monthly withdrawal, expected return, tenure.
- **Logic:** monthly recursion `balance = balance × (1 + i) − withdrawal`. Closed-form lifetime: `n = −ln(1 − B·i/W) / ln(1 + i)`.
- **Key insight:** if `B × i ≥ W` (monthly growth covers the withdrawal) the corpus never runs out. Return `∞` and say so.
- **Note:** the site's MF-research SWP tool is scheme-based and uses historical NAVs. This one is a projection.

### 3.5 Tax-advantaged savings

#### 18) Public Provident Fund (PPF) Calculator ○ STANDARD
- **Concept:** Government-backed savings account. 15-year lock-in, extendable in 5-year blocks. Interest is tax-free.
- **Inputs:** yearly deposit (max ₹1.5 lakh per financial year), tenure (15+ years), interest rate.
- **Logic (simplified):** annual compounding. For deposits at the start of each year: `FV = D × [((1 + r)^n − 1) / r] × (1 + r)`. In reality interest accrues monthly on the lowest balance between the 5th and month-end, and is credited yearly.
- **Do not hardcode the rate.** The government revises it quarterly. Make it an input with a note.

#### 19) Employees Provident Fund (EPF) Calculator ○ STANDARD
- **Concept:** Retirement savings from salary deductions.
- **Inputs:** monthly basic + DA, employee contribution % (12%), employer contribution % (12%), expected salary growth, declared EPF interest rate, years.
- **Logic (simplified):** employee 12% goes to EPF. Employer 12% is split: 8.33% to EPS (pension, capped on a ₹15,000 wage ceiling) and the remainder to EPF. Balance grows monthly at `rate/12` and interest is credited yearly. Verify current contribution rules before shipping.

### 3.6 Loans

#### 20–23) Home Loan, Personal Loan, Car Loan, Education Loan EMI ○ STANDARD
- **Concept:** Equated Monthly Instalment. A fixed payment that covers interest and principal, with the interest share falling over time.
- **Inputs:** loan amount, annual interest rate (%), tenure (months or years).
- **Logic:** `EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)`, where `r = annual_rate / 12 / 100` and `n` = months.
- **Outputs:** EMI, total interest = `EMI × n − P`, total payment = `EMI × n`.
- **Amortisation schedule (recommended):**
  ```
  for each month:
      interest  = balance × r
      principal = EMI − interest
      balance  -= principal
  ```
- The four calculators are identical. Only defaults and tenure limits differ (for example, education loans often add a moratorium period).
- **Edge case:** rate = 0 gives `EMI = P / n`.

### 3.7 Allocation, tax and protection

#### 24) Asset Allocation ○ STANDARD
- **Concept:** Split money between equity, debt and gold by risk profile.
- **Logic:** the site's method is unverified. A workable design is a risk-score questionnaire (age, horizon, income stability, loss tolerance) mapped to fixed buckets, for example conservative / moderate / aggressive. Treat the bucket table as configuration, not fact.

#### 25) Cost Inflation Index (CII) ○ STANDARD
- **Concept:** Adjusts an asset's purchase price for inflation to reduce taxable capital gain.
- **Logic:** `indexed_cost = cost × CII(year of sale) / CII(year of purchase)`. Base year 2001-02 = 100.
- **Data:** load the CII table from the Income Tax Department notification. Do not type values from memory.
- **Caveat:** indexation was withdrawn for most assets for transfers from 23 July 2024, with limited transitional relief (for example for some land and buildings bought before that date). Verify current tax rules before showing this calculator to users.

#### 26) Human Life Value (HLV) Calculator ○ STANDARD
- **Concept:** Estimates the life cover your family needs to replace your income if you die.
- **Two common methods:**
  1. Income multiple: cover ≈ 10–15 × annual income (rule of thumb).
  2. Present-value method: `HLV = Σ over t=1..N of (income − personal_expenses) × (1+g)^t / (1+d)^t`, where `N` = years to retirement, `g` = income growth, `d` = discount rate. Then `+ liabilities − existing cover − existing investments`.
- **Growing annuity shortcut** (when `g ≠ d`): `PV = X × [1 − ((1+g)/(1+d))^N] / (d − g)`, where `X` is next year's net income. Handle `g = d` separately: `PV = X × N / (1+d)`.
- The site's exact method is unverified.

### 3.8 Wealth snapshot

#### 27) Net Worth Calculator ○ STANDARD
- **Concept:** What you own minus what you owe.
- **Logic:** `net_worth = total_assets − total_liabilities`. Group assets (liquid, investments, property, other) and liabilities (home loan, personal loan, cards). Optional ratios: liquidity ratio = liquid assets / monthly expenses, debt-to-asset ratio = liabilities / assets.

---

## 4. Shared validation and edge cases

Apply these in the shared layer, so every calculator behaves the same.

| Case | Behaviour |
|---|---|
| `return = 0` | `sip_fv` uses `payment × months`. Solver divides by months. Avoids divide-by-zero. |
| `years ≤ 0` (target age ≤ current age) | Show a validation error. Do not compute. |
| `savings_grown ≥ inflated_goal` | `final_target = 0`, SIP = 0. Tell the user their savings already meet the goal. |
| Very large `years × return` | Watch for float overflow. Cap inputs to the site's slider ranges. |
| SWP never exhausts | Return `∞`, show "corpus lasts through the tenure". |
| Return input above the slider | Reject. Ranges in Section 3 come from the site. |
| Inflation or return blank | Default to 0 only where the site defaults to 0. Otherwise require input. |

**Disclaimers to display** (the site shows equivalents): projections assume a constant return, ignore volatility, sequence risk and tax on gains, and are illustrative, not advice.

---

## 5. Test vectors (write these as unit tests)

All values below come from real site output and were reproduced by the reference code in Section 2. Allow ±₹2 for rounding.

**V1 — Retirement / goal-solver** (from a live white-label of the Advisorkhoj calculator)
```
today_goal = 50,00,000   years = 30 (age 30 -> 60)
inflation  = 5%          return = 12.5%
savings    = 1,00,000    (back-solved; the displayed slider value did not match the output)

inflated_goal   = 2,16,09,712
savings_grown   =    34,24,330
final_target    = 1,81,85,382
monthly_sip     = 5,343
total_invested  =    19,23,480   (5,343 × 360)
total_growth    = 1,62,61,902
```
Uses effective monthly rate and start-of-month payments.

**V2 — SIP calculator, start-of-month**
```
P = 10,000   months = 156   r = 15%   i = r/12   due = True
invested = 15,60,000   growth = 32,54,838   FV = 48,14,838
```

**V3 — SIP calculator, end-of-month**
```
P = 10,000   months = 60   r = 14%   i = r/12   due = False
invested = 6,00,000   growth = 2,61,951   FV = 8,61,951
```
V2 and V3 use different timing conventions, so the SIP calculator changed at some point. Keep the `due` flag and pick the live behaviour.

**Sanity checks (self-consistency, not from the site)**
- `total_invested + total_growth == final_target` for every goal-solver output.
- `sip_fv(sip_for_target(T, m, i), m, i) == T`.
- EMI: ₹50,00,000 at 8.5% for 240 months gives about ₹43,391.
- SWP: ₹1 Cr corpus, ₹60,000/month, 8% return gives `∞` (monthly growth of about ₹66,667 exceeds the withdrawal).

---

## 6. Mapping to the original list of 26

| # | Name on the site | Section |
|---|---|---|
| 1 | Become A Crorepati | 3.1 #1 |
| 2 | Systematic Investment Plan Calculator | 3.1 #2 |
| 3 | Mutual Fund SIP Calculator Step Up | 3.1 #3 |
| 4 | Goal based Top Up SIP | 3.1 #4 |
| 5 | Target Amount SIP Calculator | 3.1 #5 |
| 6 | SIP with Annual Increase | 3.1 #6 |
| 7 | Public Provident Fund (PPF) Calculator | 3.5 #18 |
| 8 | Employees Provident Fund Calculator | 3.5 #19 |
| 9 | SWP Calculator | 3.4 #17 |
| 10 | Retirement Planning Calculator | 3.3 #15 |
| 11 | Asset Allocation | 3.7 #24 |
| 12 | Home Loan EMI Calculator | 3.6 |
| 13 | Personal Loan EMI Calculator | 3.6 |
| 14 | Car Loan EMI Calculator | 3.6 |
| 15 | Education Loan EMI Calculator | 3.6 |
| 16 | Goal Setting Calculator | 3.3 #12 |
| 17 | Composite Financial Goal Planner | 3.3 #13 |
| 18 | Cost Inflation Index | 3.7 #25 |
| 19 | Compounding Calculator | 3.2 #9 |
| 20 | Spending Less Calculator | 3.2 #11 |
| 21 | Future Value Inflation Calculator | 3.2 #10 |
| 22 | Human Life Value Calculator | 3.7 #26 |
| 23 | Lumpsum Target Calculator | 3.2 #8 |
| 24 | Lumpsum Calculator | 3.2 #7 |
| 25 | Children Education Planner | 3.3 #14 |
| 26 | Net Worth Calculator | 3.8 #27 |

---

## 7. Suggested build order for Claude Code

1. **Engines** (Section 2) plus unit tests from Section 5. Do not proceed until V1–V3 pass.
2. **`goal_sip()`** wrapper, then the five goal calculators as thin UIs over it.
3. **SIP, step-up, lumpsum, compounding, future value.** Simple wrappers over E1–E2.
4. **EMI family** with the amortisation schedule.
5. **SWP, PPF, EPF.** Add rate and rule inputs. Do not hardcode government rates.
6. **HLV, Net worth, Asset allocation, CII.** These need product decisions (see Section 8) before coding.
7. **NAV-driven tools** (SIP with Annual Increase, scheme-based SWP) only if a NAV data source exists.

## 8. Open questions to settle before shipping

- Which SIP timing convention is live on Advisorkhoj today (start vs end of month, `r/12` vs effective)? Test with V2 and V3 on the live page.
- What method do Advisorkhoj's HLV and Asset Allocation calculators use? This file only has generic approaches.
- Does Spending Less treat savings as a monthly SIP or a yearly lump sum?
- Composite Goal Planner: one blended SIP, or one SIP per goal? The file assumes per-goal.
- Tax rules (CII, PPF, EPF rates) change. Keep them in a config file with an "as of" date.
