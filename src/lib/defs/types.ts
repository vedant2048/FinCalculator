export type Format = "inr" | "pct" | "years" | "months" | "number" | "text";

export type NumberField = {
  kind: "number";
  key: string;
  label: string;
  unit: "inr" | "pct" | "years" | "months" | "age" | "number";
  min: number;
  max: number;
  step: number;
  default: number;
  /** Slider uses a cubic curve so wide ₹ ranges stay usable at the low end. */
  wide?: boolean;
  hint?: string;
  section?: string;
};

export type SelectField = {
  kind: "select";
  key: string;
  label: string;
  options: { value: string; label: string }[];
  default: string;
  hint?: string;
  section?: string;
};

export type Field = NumberField | SelectField;

export type Values = Record<string, number | string>;

export type Output = { label: string; value: number | string; format: Format };

export type Table = {
  caption: string;
  columns: { label: string; format: Format }[];
  rows: (number | string)[][];
};

export type Result =
  | {
      primary: Output;
      groups: { title?: string; items: Output[] }[];
      /** Two-part share bar, e.g. invested vs growth. */
      split?: [Output, Output];
      table?: Table;
      message?: string;
    }
  | { error: string };

export type CalculatorDef = {
  fields: Field[];
  compute: (v: Values) => Result;
  notes?: string[];
};

// Field factories keep the definitions short.
type Opts = Partial<Pick<NumberField, "step" | "hint" | "section" | "wide">>;

export const inr = (
  key: string,
  label: string,
  min: number,
  max: number,
  def: number,
  opts: Opts = {},
): NumberField => ({
  kind: "number",
  key,
  label,
  unit: "inr",
  min,
  max,
  default: def,
  step: opts.step ?? (max >= 1e6 ? 1000 : 100),
  wide: opts.wide ?? max / Math.max(min, 1) >= 100,
  ...opts,
});

export const pct = (
  key: string,
  label: string,
  min: number,
  max: number,
  def: number,
  opts: Opts = {},
): NumberField => ({
  kind: "number",
  key,
  label,
  unit: "pct",
  min,
  max,
  default: def,
  step: 0.1,
  ...opts,
});

export const years = (
  key: string,
  label: string,
  min: number,
  max: number,
  def: number,
  opts: Opts = {},
): NumberField => ({
  kind: "number",
  key,
  label,
  unit: "years",
  min,
  max,
  default: def,
  step: 1,
  ...opts,
});

export const age = (
  key: string,
  label: string,
  min: number,
  max: number,
  def: number,
  opts: Opts = {},
): NumberField => ({
  kind: "number",
  key,
  label,
  unit: "age",
  min,
  max,
  default: def,
  step: 1,
  ...opts,
});

export const num = (v: Values, key: string) => Number(v[key]);
export const str = (v: Values, key: string) => String(v[key]);
