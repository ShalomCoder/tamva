import { badgeClassFor, formatAmount, isCurrencyKey, isIsoDate, relativeTime, shortId, titleCase } from "../lib/format";

const ID_RE = /(^|_)(id|code|token|reference|version)$/i;
const KNOWN_ENUMS =
  /^(status|state|risk_level|risk_mark|decision|severity|direction|level|health|outcome|method|category|type|actor_type|purpose|channel|environment)$/i;

function looksLikeId(value: string): boolean {
  return /^[a-z]{2,5}_[A-Za-z0-9]{6,}$/.test(value) || /^(inst_demo|app_demo)$/.test(value);
}

/**
 * Renders a single API value with type-aware presentation: ISO dates get
 * relative + absolute treatment, currency-ish numbers get formatted,
 * enum-like strings get design-system badges and long ids get truncated.
 */
export function FieldValue({
  field,
  value,
  compact = false,
}: {
  field: string;
  value: unknown;
  compact?: boolean;
}) {
  if (value === null || value === undefined) {
    return <span className="text-muted">—</span>;
  }

  if (typeof value === "boolean") {
    return <span className={`badge badge-tone-${value ? "low" : "high"}`}>{value ? "Yes" : "No"}</span>;
  }

  if (typeof value === "number") {
    if (isCurrencyKey(field)) return <span className="text-mono">{formatAmount(value)}</span>;
    return <span className="text-mono">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted">[]</span>;
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return <span className="text-secondary">{value.map(String).join(", ")}</span>;
    }
    return <span className="text-secondary">{value.length} item{value.length === 1 ? "" : "s"}</span>;
  }

  if (typeof value === "object") {
    return <span className="text-secondary">{Object.keys(value as object).length} field(s)</span>;
  }

  const str: string = String(value as string | number | boolean | bigint | symbol);
  if (str === "") return <span className="text-muted">—</span>;

  if (isIsoDate(str)) {
    if (compact) return <span title={str}>{relativeTime(str)}</span>;
    return (
      <span title={str} className="flex-col" style={{ gap: 0 }}>
        <span>{new Date(str).toLocaleString()}</span>
        <span className="text-muted" style={{ fontSize: 11 }}>
          {relativeTime(str)}
        </span>
      </span>
    );
  }

  if (KNOWN_ENUMS.test(field) && str === str.toUpperCase() && /^[A-Z_]+$/.test(str)) {
    return <span className={badgeClassFor(str)}>{titleCase(str)}</span>;
  }

  if (isCurrencyKey(field) && /^-?\d+(\.\d+)?$/.test(str)) {
    return <span className="text-mono">{formatAmount(str)}</span>;
  }

  if (ID_RE.test(field) || looksLikeId(str)) {
    return (
      <span className="cell-id" title={str}>
        {compact ? shortId(str) : str}
      </span>
    );
  }

  return <span>{str}</span>;
}
