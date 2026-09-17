import { Link, useNavigate } from "react-router-dom";
import { api, extractList, healthApi } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../lib/auth";
import { formatAmount, titleCase } from "../lib/format";
import { DataTable } from "../components/DataTable";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";

interface DashboardData {
  customers: number;
  accounts: number;
  cases: Record<string, unknown>[];
  riskEvents: Record<string, unknown>[];
  evaluations: Record<string, unknown>[];
  ledger: Record<string, unknown>[];
  health: unknown;
  ready: unknown;
  failures: string[];
}

async function loadDashboard(): Promise<DashboardData> {
  const failures: string[] = [];
  async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      failures.push(label);
      return null;
    }
  }

  const [customers, accounts, cases, riskEvents, evaluations, ledger, health, ready] = await Promise.all([
    safe("customers", () => api.get<Record<string, unknown>>("/v1/customers", { query: { limit: 100 } })),
    safe("accounts", () => api.get<Record<string, unknown>>("/v1/accounts", { query: { limit: 100 } })),
    safe("cases", () => api.get<Record<string, unknown>>("/v1/cases", { query: { limit: 100 } })),
    safe("risk events", () => api.get<Record<string, unknown>>("/v1/risk/events", { query: { limit: 100 } })),
    safe("evaluations", () => api.get<Record<string, unknown>>("/v1/risk/evaluations", { query: { limit: 100 } })),
    safe("ledger", () => api.get<Record<string, unknown>>("/v1/ledger", { query: { limit: 100 } })),
    safe("health", () => healthApi.health()),
    safe("ready", () => healthApi.ready()),
  ]);

  return {
    customers: extractList(customers, "customers").length,
    accounts: extractList(accounts, "accounts").length,
    cases: extractList(cases, "cases"),
    riskEvents: extractList(riskEvents, "events"),
    evaluations: extractList(evaluations, "evaluations"),
    ledger: extractList(ledger, "entries"),
    health,
    ready,
    failures,
  };
}

function kpi(label: string, value: string | number, hint?: string, tone?: string) {
  return (
    <div className="kpi-card" key={label}>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__row">
        <span className="metric-value">{value}</span>
        {tone ? <span className={`badge badge-tone-${tone}`}>{titleCase(tone)}</span> : null}
      </div>
      {hint ? (
        <div className="text-muted" style={{ fontSize: 11, marginTop: 6 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function countBy(rows: Record<string, unknown>[], field: string): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = row[field];
    if (value === null || value === undefined) continue;
    const k = String(value);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function Distribution({ title, entries, tone }: { title: string; entries: Array<[string, number]>; tone: (v: string) => string }) {
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-body">
        {entries.length === 0 ? (
          <p className="text-secondary">No data.</p>
        ) : (
          <div className="flex-col gap-12">
            {entries.map(([label, count]) => (
              <div key={label} className="flex-col" style={{ gap: 6 }}>
                <div className="flex items-center justify-between">
                  <span className={`badge badge-tone-${tone(label)}`}>{titleCase(label)}</span>
                  <span className="text-mono">{count}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => loadDashboard(), []);
  const who = auth.actor?.email ?? auth.actor?.app_client_id ?? "operator";

  if (loading) {
    return (
      <div className="card">
        <LoadingState text="Loading your institution overview…" />
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

  const openCases = data.cases.filter((c) => !["RESOLVED", "CLOSED"].includes(String(c.status))).length;
  const highRisk = data.riskEvents.filter((e) => ["HIGH", "CRITICAL"].includes(String(e.risk_level ?? e.severity))).length;
  const inflow = data.ledger
    .filter((e) => e.direction === "INFLOW")
    .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const outflow = data.ledger
    .filter((e) => e.direction === "OUTFLOW")
    .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  const readiness = data.ready && typeof data.ready === "object" ? (data.ready as Record<string, unknown>).status ?? "ok" : "unknown";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${who}`}
        subtitle="A live view of your institution's risk, customers and money movement."
        actions={
          <>
            <span className={`badge badge-tone-${readiness === "unknown" ? "medium" : "low"}`}>API {String(readiness)}</span>
            <button className="btn btn-secondary" onClick={() => reload()}>
              <Icon name="refresh-cw" size={15} /> Refresh
            </button>
          </>
        }
      />

      {data.failures.length > 0 ? (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--risk-medium)" }}>
          <div className="card-body flex items-center gap-8">
            <Icon name="alert-triangle" size={16} />
            <span className="text-secondary">
              Some data could not be loaded: {data.failures.join(", ")}. Missing scopes may hide sections.
            </span>
          </div>
        </div>
      ) : null}

      <section className="kpi-grid">
        {kpi("Customers", data.customers, "In this institution")}
        {kpi("Accounts", data.accounts, "Active + closed")}
        {kpi("Open cases", openCases, `${data.cases.length} total`, openCases > 0 ? "medium" : "low")}
        {kpi("High-risk events", highRisk, `${data.riskEvents.length} evaluated`, highRisk > 0 ? "high" : "low")}
      </section>

      <section className="kpi-grid">
        {kpi("Ledger inflow", formatAmount(inflow), `${data.ledger.length} entries`, "low")}
        {kpi("Ledger outflow", formatAmount(outflow), "Across all accounts", "high")}
        {kpi("Evaluations", data.evaluations.length, "Risk decisions scored", "info")}
        {kpi("Net flow", formatAmount(inflow - outflow), "Inflow − outflow", inflow - outflow >= 0 ? "low" : "high")}
      </section>

      <section className="charts-grid" style={{ marginTop: 16 }}>
        <Distribution title="Risk events by level" entries={countBy(data.riskEvents, "risk_level")} tone={riskTone} />
        <Distribution title="Cases by status" entries={countBy(data.cases, "status")} tone={statusTone} />
      </section>

      <div className="card table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Recent risk events</span>
          <Link to="/r/risk-events" className="btn btn-ghost btn-sm">
            View all <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        <DataTable
          rows={data.riskEvents.slice(0, 6)}
          columns={["id", "customer_id", "risk_level", "decision", "score", "created_at"]}
          rowId={(row) => String(row.id)}
          onRowClick={(row) => navigate(`/r/risk-events/${row.id}`)}
        />
      </div>
    </>
  );
}

function riskTone(value: string): string {
  const v = value.toUpperCase();
  if (v === "LOW" || v === "MINIMAL") return "low";
  if (v === "MEDIUM") return "medium";
  return "high";
}

function statusTone(value: string): string {
  const v = value.toUpperCase();
  if (["RESOLVED", "CLOSED"].includes(v)) return "low";
  if (["INVESTIGATING", "PENDING"].includes(v)) return "medium";
  if (["ESCALATED"].includes(v)) return "high";
  return "info";
}
