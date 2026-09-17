import { api, extractList } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { formatAmount } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { BarChart, LineChart, type SeriesPoint } from "../components/Charts";
import { DataTable } from "../components/DataTable";

async function load() {
  async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }
  const [events, evaluations, ledger, transactions, cases] = await Promise.all([
    safe(() => api.get<unknown>("/v1/risk/events", { query: { limit: 200 } })),
    safe(() => api.get<unknown>("/v1/risk/evaluations", { query: { limit: 200 } })),
    safe(() => api.get<unknown>("/v1/ledger", { query: { limit: 200 } })),
    safe(() => api.get<unknown>("/v1/transactions", { query: { limit: 200 } })),
    safe(() => api.get<unknown>("/v1/cases", { query: { limit: 200 } })),
  ]);
  return {
    events: extractList(events, "events"),
    evaluations: extractList(evaluations, "evaluations"),
    ledger: extractList(ledger, "entries"),
    transactions: extractList(transactions, "transactions"),
    cases: extractList(cases, "cases"),
  };
}

function countBy(rows: Record<string, unknown>[], field: string): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const v = row[field];
    if (v === null || v === undefined) continue;
    const k = String(v);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function bucketByDay(rows: Record<string, unknown>[], dateField: string, valueField?: string): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = row[dateField];
    if (typeof raw !== "string") continue;
    const day = raw.slice(5, 10);
    const value = valueField ? Number(row[valueField] ?? 0) : 1;
    map.set(day, (map.get(day) ?? 0) + value);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-14);
}

export function AnalyticsPage() {
  const { data, error, loading, reload } = useAsync(() => load(), []);

  if (loading)
    return (
      <div className="card">
        <LoadingState text="Crunching analytics…" />
      </div>
    );
  if (error || !data)
    return (
      <div className="card">
        <ErrorState error={error ?? ({ message: "No data" } as never)} onRetry={reload} />
      </div>
    );

  const scoreBuckets: SeriesPoint[] = [
    { label: "0-50", value: 0 },
    { label: "51-100", value: 0 },
    { label: "101-150", value: 0 },
    { label: "151-250", value: 0 },
    { label: "251+", value: 0 },
  ];
  for (const e of data.evaluations) {
    const score = Number(e.score ?? 0);
    const idx = score <= 50 ? 0 : score <= 100 ? 1 : score <= 150 ? 2 : score <= 250 ? 3 : 4;
    scoreBuckets[idx].value += 1;
  }

  const inflowOutflow = [
    {
      label: "INFLOW",
      value: data.ledger.filter((e) => e.direction === "INFLOW").reduce((s, e) => s + Number(e.amount ?? 0), 0),
    },
    {
      label: "OUTFLOW",
      value: data.ledger.filter((e) => e.direction === "OUTFLOW").reduce((s, e) => s + Number(e.amount ?? 0), 0),
    },
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Risk score distribution, decision outcomes and money movement across your tenant."
      />

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Risk score distribution</span>
          </div>
          <div className="card-body">
            <BarChart data={scoreBuckets} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Ledger flow by direction</span>
          </div>
          <div className="card-body">
            <BarChart data={inflowOutflow} color="var(--info)" />
            <p className="text-secondary" style={{ marginTop: 10, fontSize: 12 }}>
              Inflow {formatAmount(inflowOutflow[0].value)} · Outflow {formatAmount(inflowOutflow[1].value)}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Ledger entries over time</span>
          </div>
          <div className="card-body">
            <LineChart data={bucketByDay(data.ledger, "created_at")} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Decisions</span>
          </div>
          <div className="card-body">
            <BarChart data={countBy(data.evaluations, "decision")} color="var(--purple)" />
          </div>
        </div>
      </div>

      <div className="card table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Recent evaluations</span>
        </div>
        <DataTable
          rows={data.evaluations.slice(0, 12)}
          columns={["id", "customer_id", "score", "risk_level", "decision", "created_at"]}
          rowId={(row) => String(row.id)}
        />
      </div>
    </>
  );
}
