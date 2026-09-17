import { Link, useSearchParams } from "react-router-dom";
import { api, extractList } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { DataTable } from "../components/DataTable";
import { basePath } from "../components/ResourceListPage";
import { resourceByKey } from "../lib/resources";

interface ResultSet {
  key: string;
  title: string;
  rows: Record<string, unknown>[];
  columns: string[];
}

async function search(q: string): Promise<ResultSet[]> {
  const needle = q.toLowerCase();
  const sources: Array<{ key: string; url: string; listKey: string; columns: string[] }> = [
    { key: "customers", url: "/v1/customers", listKey: "customers", columns: ["id", "status", "created_at"] },
    { key: "transactions", url: "/v1/transactions", listKey: "transactions", columns: ["id", "type", "direction", "amount", "currency"] },
    { key: "cases", url: "/v1/cases", listKey: "cases", columns: ["id", "status", "severity", "created_at"] },
    { key: "consents", url: "/v1/consents", listKey: "consents", columns: ["id", "customer_id", "purpose", "status"] },
    { key: "accounts", url: "/v1/accounts", listKey: "accounts", columns: ["id", "customer_id", "type", "status", "balance"] },
    { key: "ledger", url: "/v1/ledger", listKey: "entries", columns: ["id", "account_id", "direction", "amount", "currency"] },
  ];

  const results = await Promise.all(
    sources.map(async (src) => {
      try {
        const payload = await api.get<unknown>(src.url, { query: { limit: 100 } });
        const rows = extractList(payload, src.listKey).filter((row) =>
          JSON.stringify(row).toLowerCase().includes(needle),
        );
        return { key: src.key, title: resourceByKey(src.key)?.label ?? src.key, rows, columns: src.columns };
      } catch {
        return { key: src.key, title: src.key, rows: [], columns: src.columns };
      }
    }),
  );
  return results;
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, error, loading, reload } = useAsync(() => search(q), [q]);

  return (
    <>
      <PageHeader
        title={q ? `Results for “${q}”` : "Search"}
        subtitle="Searches customers, transactions, cases, consents, accounts and ledger client-side across your tenant."
      />
      {loading ? (
        <div className="card">
          <LoadingState text="Searching…" />
        </div>
      ) : error || !data ? (
        <div className="card">
          <ErrorState error={error ?? ({ message: "Search failed" } as never)} onRetry={reload} />
        </div>
      ) : data.every((r) => r.rows.length === 0) ? (
        <div className="card">
          <div className="state-block">
            <p className="state-block__title">No matches</p>
            <p className="text-secondary">Nothing in your tenant matched that query.</p>
          </div>
        </div>
      ) : (
        <div className="section-stack">
          {data
            .filter((r) => r.rows.length > 0)
            .map((result) => (
              <div className="card table-card" key={result.key}>
                <div className="card-header">
                  <span className="card-title">
                    {result.title} · {result.rows.length}
                  </span>
                  <Link to={basePath(resourceByKey(result.key)!)} className="btn btn-ghost btn-sm">
                    Browse all
                  </Link>
                </div>
                <DataTable rows={result.rows} columns={result.columns} rowId={(row) => String(row.id)} />
              </div>
            ))}
        </div>
      )}
    </>
  );
}
