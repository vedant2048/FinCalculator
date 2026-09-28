// Government-set rates and rules change. Every value here is only a *default*
// for an editable input, and carries the date it was last checked (tools.md §8).

export const PPF = {
  ratePct: 7.1,
  asOf: "Q2 FY 2026-27 (Jul–Sep 2026)",
  maxYearlyDeposit: 1_50_000,
  minYearlyDeposit: 500,
};

export const EPF = {
  ratePct: 8.25,
  asOf: "FY 2025-26",
  employeePct: 12,
  employerPct: 12,
  epsPct: 8.33,
  epsWageCeiling: 15_000,
};

// Cost Inflation Index, base year 2001-02 = 100.
// Source: CBDT notifications, latest Notification No. 85/2026 dated 15 July 2026
// (FY 2026-27 = 384). Cross-checked against two published copies of the table.
export const CII_AS_OF = "Notification No. 85/2026 (15 July 2026)";
export const CII: Record<string, number> = {
  "2001-02": 100,
  "2002-03": 105,
  "2003-04": 109,
  "2004-05": 113,
  "2005-06": 117,
  "2006-07": 122,
  "2007-08": 129,
  "2008-09": 137,
  "2009-10": 148,
  "2010-11": 167,
  "2011-12": 184,
  "2012-13": 200,
  "2013-14": 220,
  "2014-15": 240,
  "2015-16": 254,
  "2016-17": 264,
  "2017-18": 272,
  "2018-19": 280,
  "2019-20": 289,
  "2020-21": 301,
  "2021-22": 317,
  "2022-23": 331,
  "2023-24": 348,
  "2024-25": 363,
  "2025-26": 376,
  "2026-27": 384,
};
