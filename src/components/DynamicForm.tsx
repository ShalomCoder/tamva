import { useState, type FormEvent } from "react";
import type { FieldDef } from "../lib/resources";
import { humanizeKey } from "../lib/format";

export type FormValues = Record<string, unknown>;

interface DynamicFormProps {
  fields: FieldDef[];
  initial?: FormValues;
  submitLabel?: string;
  onSubmit: (values: FormValues) => void | Promise<void>;
  onCancel?: () => void;
  busy?: boolean;
}

function defaultFor(field: FieldDef): string {
  return field.defaultValue ?? "";
}

function coerce(field: FieldDef, raw: string): { value: unknown; error?: string } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    if (field.required) return { value: undefined, error: `${field.label ?? humanizeKey(field.name)} is required` };
    return { value: undefined };
  }
  if (field.type === "json") {
    try {
      return { value: JSON.parse(trimmed) };
    } catch {
      return { value: undefined, error: "Invalid JSON" };
    }
  }
  if (field.type === "number") {
    const n = Number(trimmed);
    if (Number.isNaN(n)) return { value: undefined, error: "Must be a number" };
    return { value: n };
  }
  if (field.name === "confirmed_fraud") {
    return { value: trimmed === "true" };
  }
  return { value: raw };
}

export function DynamicForm({ fields, initial, submitLabel = "Submit", onSubmit, onCancel, busy }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const f of fields) {
      const init = initial?.[f.name];
      seed[f.name] = init !== undefined && init !== null ? (typeof init === "object" ? JSON.stringify(init) : String(init)) : defaultFor(f);
    }
    return seed;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const payload: FormValues = {};
    for (const field of fields) {
      const { value, error } = coerce(field, values[field.name] ?? "");
      if (error) nextErrors[field.name] = error;
      if (value !== undefined) payload[field.name] = value;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    void onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      {fields.map((field) => {
        const label = field.label ?? humanizeKey(field.name);
        const value = values[field.name] ?? "";
        const setValue = (v: string) => setValues((prev) => ({ ...prev, [field.name]: v }));
        const common = {
          id: `field-${field.name}`,
          name: field.name,
          value,
          required: field.required,
          placeholder: field.placeholder,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setValue(e.target.value),
        };
        return (
          <div className="form-field" key={field.name}>
            <label className="form-label" htmlFor={common.id}>
              {label} {field.required ? <span style={{ color: "var(--risk-high)" }}>*</span> : null}
            </label>
            {field.type === "select" && field.options ? (
              <select className="form-input" {...common}>
                <option value="">{field.required ? "Select…" : "—"}</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" || field.type === "json" ? (
              <textarea
                className="form-input form-input--mono"
                rows={field.type === "json" ? 4 : 3}
                {...common}
              />
            ) : (
              <input
                className="form-input"
                type={field.type === "password" ? "password" : field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type === "email" ? "email" : "text"}
                {...common}
              />
            )}
            {errors[field.name] ? <small className="form-error">{errors[field.name]}</small> : null}
            {!errors[field.name] && field.help ? <small className="form-help">{field.help}</small> : null}
          </div>
        );
      })}
      <div className="modal__footer" style={{ margin: "8px -20px -20px", paddingLeft: 20, paddingRight: 20 }}>
        {onCancel ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Working…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
