"use client";
import { useCallback, useState } from "react";
import { FieldError, FieldLabel, useField } from "@payloadcms/ui";
import { TZDate } from "@date-fns/tz";
import type { DateFieldClientProps, Validate } from "payload";
import { CLINIC_TIMEZONE } from "@/lib/clinic-calendar";

const INVALID_TIME = "invalid-orlando-appointment-time";
const timeError =
  "This time does not exist in Orlando because the clocks change. Choose another time.";
function localInput(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const date = new TZDate(value, CLINIC_TIMEZONE);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function utcValue(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input);
  if (!match) return INVALID_TIME;
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new TZDate(year, month - 1, day, hour, minute, CLINIC_TIMEZONE);
  const value = Number.isFinite(date.getTime())
    ? new Date(date.getTime()).toISOString()
    : "";
  // TZDate normalizes nonexistent spring clock times. Reject that normalization
  // instead of silently scheduling a different wall-clock time.
  return value && localInput(value) === input ? value : INVALID_TIME;
}

export function AppointmentDate({
  path,
  field,
  readOnly,
  validate,
}: DateFieldClientProps) {
  const [draft, setDraft] = useState<{ input: string; value: string | null }>();
  const validateDate = useCallback<Validate>(
    (candidate, options) => {
      if (candidate === INVALID_TIME) return timeError;
      if (validate)
        return validate(candidate, {
          ...options,
          name: field.name,
          type: "date",
          required: field.required,
        });
      return field.required && !candidate ? "Choose a date and time." : true;
    },
    [field.name, field.required, validate],
  );
  const { value, setValue, disabled, showError } = useField<string | null>({
    path,
    validate: validateDate,
  });
  const inputId = `appointment-${path.replaceAll(".", "-")}`;
  const error = value === INVALID_TIME ? timeError : "";
  return (
    <div
      className={`field-type date-time-field${showError || error ? " error" : ""}`}
    >
      <FieldLabel
        htmlFor={inputId}
        path={path}
        label={field.label}
        required={field.required}
      />
      <FieldError path={path} showError={showError} />
      <input
        id={inputId}
        name={path}
        type="datetime-local"
        step={60}
        value={draft && draft.value === value ? draft.input : localInput(value)}
        readOnly={readOnly || disabled}
        required={field.required}
        aria-invalid={!!error || showError}
        ref={(element) => element?.setCustomValidity(error)}
        aria-describedby={`${inputId}-timezone${error ? ` ${inputId}-error` : ""}`}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "4px",
          background: "var(--theme-elevation-0)",
          color: "var(--theme-text)",
          font: "inherit",
        }}
        onChange={(event) => {
          const input = event.target.value;
          const next = input ? utcValue(input) : null;
          setDraft({ input, value: next });
          // The deliberately invalid marker makes Payload's own server-side date
          // validation reject this field too, even if native validation is bypassed.
          setValue(next);
        }}
      />
      <p id={`${inputId}-timezone`} className="field-description">
        Orlando time (America/New_York). Daylight saving time is applied
        automatically.
      </p>
      {error && (
        <p id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
