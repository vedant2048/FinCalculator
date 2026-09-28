"use client";

import { useId } from "react";
import type { NumberField, SelectField } from "@/lib/defs/types";
import { formatCompactINR, formatNumber } from "@/lib/format";

const SLIDER_STEPS = 1000;

/** Round to 2 significant figures, then to the field's step. */
function roundNice(value: number, step: number) {
  if (value <= 0) return 0;
  const mag = 10 ** (Math.floor(Math.log10(value)) - 1);
  const nice = Math.round(value / mag) * mag;
  return Math.max(step, Math.round(nice / step) * step);
}

// Wide ranges use a cubic curve so small amounts still get most of the track.
function toSlider(field: NumberField, value: number) {
  const t = (Math.min(Math.max(value, field.min), field.max) - field.min) / (field.max - field.min);
  return Math.round((field.wide ? Math.cbrt(t) : t) * SLIDER_STEPS);
}

function fromSlider(field: NumberField, pos: number) {
  const t = pos / SLIDER_STEPS;
  if (!field.wide) {
    const raw = field.min + t * (field.max - field.min);
    return Number((Math.round(raw / field.step) * field.step).toFixed(4));
  }
  const raw = field.min + t ** 3 * (field.max - field.min);
  return Math.min(field.max, Math.max(field.min, roundNice(raw, field.step)));
}

const UNIT_SUFFIX: Record<NumberField["unit"], string> = {
  inr: "",
  pct: "%",
  years: "yrs",
  months: "mos",
  age: "yrs",
  number: "",
};

export function validateNumber(field: NumberField, raw: string): string | null {
  if (raw.trim() === "") return "Required";
  const value = Number(raw);
  if (!Number.isFinite(value)) return "Enter a number";
  if (value < field.min || value > field.max) {
    const fmt = (n: number) => (field.unit === "inr" ? formatCompactINR(n) : formatNumber(n));
    return `Enter ${fmt(field.min)} – ${fmt(field.max)}`;
  }
  return null;
}

export function NumberInput({
  field,
  raw,
  onChange,
}: {
  field: NumberField;
  raw: string;
  onChange: (raw: string) => void;
}) {
  const id = useId();
  const error = validateNumber(field, raw);
  const value = Number(raw);
  const suffix = UNIT_SUFFIX[field.unit];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {field.label}
        </label>
        <div className="neu-field flex w-40 shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 has-focus-visible:border-accent">
          {field.unit === "inr" && <span className="text-sm text-muted">₹</span>}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={raw}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-help`}
            onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
            onBlur={() => {
              if (!error) onChange(String(value));
            }}
            className="w-full min-w-0 bg-transparent text-right text-sm tabular-nums outline-none"
          />
          {suffix && <span className="text-xs text-muted">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        aria-label={field.label}
        min={0}
        max={SLIDER_STEPS}
        value={toSlider(field, Number.isFinite(value) ? value : field.default)}
        onChange={(e) => onChange(String(fromSlider(field, Number(e.target.value))))}
        className="neu-range"
      />
      <div id={`${id}-help`} className="flex min-h-4 flex-col gap-1 text-xs">
        {error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <>
            {field.unit === "inr" && value >= 1e5 && (
              <p className="text-right tabular-nums text-muted">{formatCompactINR(value)}</p>
            )}
            {field.hint && <p className="text-muted">{field.hint}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export function SelectInput({
  field,
  value,
  onChange,
}: {
  field: SelectField;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {field.label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="neu-field w-full appearance-none rounded-xl px-3 py-2 pr-9 text-sm"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted"
        >
          ▼
        </span>
      </div>
      {field.hint && <p className="text-xs text-muted">{field.hint}</p>}
    </div>
  );
}
