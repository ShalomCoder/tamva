/** Presentation helpers shared across list/detail pages. */

const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: "GH₵",
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  ZAR: "R",
};

export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/g, "ID")
    .replace(/\bUrl\b/g, "URL")
    .replace(/\bApi\b/g, "API");
}

export function titleCase(value: string): string {
  if (!value) return value;
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;

export function isIsoDate(value: unknown): boolean {
  return typeof value === "string" && ISO_DATE_RE.test(value);
}

export function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function relativeTime(value: string): string {
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return value;
  const diff = Date.now() - d;
  const abs = Math.abs(diff);
  const units: Array<[number, string]> = [
    [1000, "second"],
    [60_000, "minute"],
    [3_600_000, "hour"],
    [86_400_000, "day"],
    [604_800_000, "week"],
    [2_592_000_000, "month"],
    [31_536_000_000, "year"],
  ];
  let chosen: [number, string] = units[0];
  for (const unit of units) {
    if (abs >= unit[0]) chosen = unit;
  }
  const amount = Math.round(diff / chosen[0]);
  try {
    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-amount, chosen[1] as Intl.RelativeTimeFormatUnit);
  } catch {
    return formatDateTime(value);
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatAmount(value: string | number, currency?: string): string {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return `${value}${currency ? ` ${currency}` : ""}`;
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : undefined;
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 4,
  }).format(num);
  return symbol ? `${symbol}${formatted}` : currency ? `${formatted} ${currency}` : formatted;
}

export function isCurrencyKey(key: string): boolean {
  return /(amount|balance|rate|value)/i.test(key) && !/(count|version|score|number)/i.test(key);
}

export function truncate(value: string, max = 28): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export type BadgeTone = "low" | "medium" | "high" | "info" | "purple" | "neutral";

/**
 * Maps a raw enum-ish value to one of the design-system badge tones so that
 * RISK / DECISION / STATUS values render consistently everywhere.
 */
export function badgeToneFor(value: string): BadgeTone {
  const v = value.toUpperCase();
  if (["LOW", "ALLOW", "APPROVE", "APPROVED", "ACTIVE", "RESOLVED", "COMPLETED", "SUCCESS", "DELIVERED", "SYNCED", "HEALTHY", "FALSE_POSITIVE", "CONFIRMED"].includes(v)) {
    return "low";
  }
  if (["MEDIUM", "REVIEW", "CHALLENGE", "PENDING", "INVESTIGATING", "PROCESSING", "SYNCING", "DEGRADED", "WARNING", "PARTIAL"].includes(v)) {
    return "medium";
  }
  if (["HIGH", "CRITICAL", "BLOCK", "BLOCKED", "HOLD", "ESCALATE", "ESCALATED", "FAILED", "ERROR", "QUARANTINED", "COMPROMISED", "SUSPICIOUS", "CONFIRMED_FRAUD", "REVOKED", "CLOSED", "DISABLED", "INACTIVE", "BANNED", "FROZEN", "DEAD"].includes(v)) {
    return "high";
  }
  if (["INFO", "OPEN", "NEW", "NOT_STARTED"].includes(v)) return "info";
  if (["SHARED", "CONSUMED", "EXPIRED"].includes(v)) return "purple";
  return "neutral";
}

export function badgeClassFor(value: string): string {
  const tone = badgeToneFor(value);
  return `badge badge-tone-${tone}`;
}

/** Deterministic human-readable id fragment for display of opaque tokens. */
export function shortId(value: string): string {
  if (!value) return value;
  const [prefix, ...rest] = value.split("_");
  const tail = rest.join("_");
  if (!tail) return truncate(value, 12);
  return `${prefix}_${tail.slice(0, 4)}…${tail.slice(-4)}`;
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}
