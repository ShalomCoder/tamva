import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";

interface PlatformSummary {
  institutions: { total: number; active: number };
  users: number;
  outbox: { pending: number; failed: number };
  deadLetter: number;
  risk: { evaluations_last_24h: number; high_critical_total: number; average_score: number };
}

const ADMIN_SECTIONS: Array<{ key: string; label: string; icon: string; description: string; to: string }> = [
  { key: "admin-institutions", label: "All Institutions", icon: "buildings", description: "Institutions and user counts", to: "/r/admin-institutions" },
  { key: "admin-users", label: "All Users", icon: "user-cog", description: "Every platform user", to: "/r/admin-users" },
  { key: "admin-audit", label: "Platform Audit", icon: "scroll-text", description: "Cross-institution audit trail", to: "/r/admin-audit" },
  { key: "admin-outbox", label: "Platform Outbox", icon: "inbox", description: "Event dispatch status", to: "/r/admin-outbox" },
  { key: "admin-outbox-dead", label: "Dead Letters", icon: "mail-warning", description: "Quarantined delivery failures", to: "/r/admin-outbox-dead" },
  { key: "admin-risk", label: "Platform Risk", icon: "gauge", description: "Risk evaluations, all institutions", to: "/r/admin-risk" },
  { key: "admin-summary", label: "Raw Summary", icon: "code-2", description: "Full summary JSON", to: "/r/admin-summary" },
];

function kpi(label: string, value: string | number, hint?: string, tone?: string) {
  return (
    <div className="kpi-card" key={label}>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__row">
        <span className="metric-value">{value}</span>
        {tone ? <span className={`badge badge-tone-${tone}`}>{tone.toUpperCase()}</span> : null}
      </div>
      {hint ? (
        <div className="text-muted" style={{ fontSize: 11, marginTop: 6 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPage() {
  const { data, error, loading, reload } = useAsync<PlatformSummary>(
    (signal) => api.get<PlatformSummary>("/v1/admin/summary", { signal }),
    [],
  );

  if (loading) {
    return (
      <div className="card">
        <LoadingState text="Loading platform summary…" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="card">
        <ErrorState error={error ?? ({ message: "No data" } as never)} onRetry={reload} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Platform Administration"
        subtitle="Cross-institution health of TAMVA — institutions, users, event dispatch and risk."
        actions={
          <button className="btn btn-secondary" onClick={() => reload()}>
            <Icon name="refresh-cw" size={15} /> Refresh
          </button>
        }
      />

      <section className="kpi-grid">
        {kpi("Institutions", `${data.institutions.active} / ${data.institutions.total}`, "Active of total", data.institutions.active > 0 ? "low" : "high")}
        {kpi("Users", data.users, "Across all institutions", "info")}
        {kpi("Outbox pending", data.outbox.pending, `${data.outbox.failed} failed`, data.outbox.failed > 0 ? "medium" : "low")}
        {kpi("Dead letters", data.deadLetter, "Quarantined events", data.deadLetter > 0 ? "high" : "low")}
      </section>

      <section className="kpi-grid">
        {kpi("Evaluations (24h)", data.risk.evaluations_last_24h, "Risk scored", "info")}
        {kpi("High / critical", data.risk.high_critical_total, "All time", data.risk.high_critical_total > 0 ? "high" : "low")}
        {kpi("Average score", data.risk.average_score.toFixed(2), "Across all evaluations", "medium")}
      </section>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Admin areas</span>
        </div>
        <div className="card-body grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {ADMIN_SECTIONS.map((s) => (
            <Link key={s.key} className="card-link" to={s.to} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Icon name={s.icon} size={20} />
              <span className="flex-col" style={{ alignItems: "flex-start", gap: 2 }}>
                <span style={{ fontWeight: 600 }}>{s.label}</span>
                <span className="text-muted" style={{ fontSize: 11 }}>
                  {s.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}