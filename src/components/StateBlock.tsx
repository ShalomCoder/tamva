import type { ApiError } from "../lib/api";
import { Icon } from "./Icon";

export function LoadingState({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="state-block">
      <div className="spinner" role="status" aria-label="Loading" />
      <p className="state-block__title" style={{ marginTop: 14 }}>
        {text}
      </p>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  text = "",
  actionLabel,
  onAction,
}: {
  title?: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="state-block">
      <div className="state-block__icon">
        <Icon name="inbox" size={20} />
      </div>
      <p className="state-block__title">{title}</p>
      {text ? <p className="text-secondary" style={{ maxWidth: 320 }}>{text}</p> : null}
      {actionLabel && onAction ? (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const details = error.details ?? [];
  return (
    <div className="state-block">
      <div className="state-block__icon" style={{ background: "var(--risk-high-bg)", color: "var(--risk-high)" }}>
        <Icon name="alert-triangle" size={20} />
      </div>
      <p className="state-block__title">{error.code === "FORBIDDEN" ? "Not permitted" : "Request failed"}</p>
      <p className="text-secondary" style={{ maxWidth: 380 }}>
        {error.message}
      </p>
      {details.length > 0 ? (
        <ul className="text-secondary" style={{ marginTop: 10, fontSize: 12, maxWidth: 460, textAlign: "left" }}>
          {details.slice(0, 6).map((d, i) => (
            <li key={i}>
              {d.field ? <span className="text-mono">{String(d.field)}</span> : null} {String(d.message ?? "")}
            </li>
          ))}
        </ul>
      ) : null}
      {onRetry ? (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
