import { useState } from "react";
import { formatAmount, humanizeKey, isCurrencyKey, isIsoDate, relativeTime, titleCase } from "../lib/format";
import { Icon } from "./Icon";

function Scalar({ field, value }: { field: string; value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted">—</span>;
  if (typeof value === "boolean") {
    return <span className={`badge badge-tone-${value ? "low" : "high"}`}>{value ? "true" : "false"}</span>;
  }
  if (typeof value === "number") {
    if (isCurrencyKey(field)) return <span className="text-mono">{formatAmount(value)}</span>;
    return <span className="text-mono">{value}</span>;
  }
  if (typeof value === "string") {
    if (isIsoDate(value)) {
      return (
        <span title={value}>
          {new Date(value).toLocaleString()} <span className="text-muted">· {relativeTime(value)}</span>
        </span>
      );
    }
    if (/^[A-Z][A-Z_]+$/.test(value)) return <span className="badge badge-tone-neutral">{titleCase(value)}</span>;
    return <span>{value}</span>;
  }
  return <span>{String(value)}</span>;
}

function Node({ label, value, depth }: { label: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isObject = value !== null && typeof value === "object";
  const entries = isObject ? Object.entries(value as Record<string, unknown>) : [];
  const isArray = Array.isArray(value);

  if (!isObject) {
    return (
      <div className="json-row">
        <span className="json-key">{humanizeKey(label)}</span>
        <span className="json-val">
          <Scalar field={label} value={value} />
        </span>
      </div>
    );
  }

  return (
    <div className="json-node">
      <button className="json-toggle" onClick={() => setOpen((o) => !o)} type="button">
        <Icon name={open ? "chevron-down" : "chevron-right"} size={14} />
        <span className="json-key">{humanizeKey(label)}</span>
        <span className="text-muted" style={{ fontSize: 11 }}>
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open ? (
        <div className="json-children">
          {entries.length === 0 ? (
            <div className="text-muted" style={{ paddingLeft: 22 }}>
              empty
            </div>
          ) : (
            entries.map(([k, v]) => <Node key={k} label={isArray ? `[${k}]` : k} value={v} depth={depth + 1} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

export function JsonTree({ data }: { data: unknown }) {
  if (data === null || data === undefined) return <div className="text-muted">No data</div>;
  if (typeof data !== "object") return <Scalar field="" value={data} />;
  return (
    <div className="json-tree">
      {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
        <Node key={k} label={k} value={v} depth={0} />
      ))}
    </div>
  );
}
