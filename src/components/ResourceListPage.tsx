import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, extractCount, extractList, type RequestOptions } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../lib/toast";
import { humanizeKey } from "../lib/format";
import type { ActionDef, ResourceDef } from "../lib/resources";
import { DataTable, type RowAction } from "./DataTable";
import { JsonTree } from "./JsonTree";
import { DynamicForm, type FormValues } from "./DynamicForm";
import { Modal } from "./Modal";
import { PageHeader } from "./PageHeader";
import { ErrorState, LoadingState } from "./StateBlock";
import { useActionRunner } from "./ActionRunner";
import { Icon } from "./Icon";

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

export function ResourceListPage({ resource }: { resource: ResourceDef }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { run, node: actionNode } = useActionRunner();
  const [query, setQuery] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [reveal, setReveal] = useState<{ label: string; value: string } | null>(null);

  const listDef = resource.list;
  const listUrl = listDef?.url ?? "";

  const { data, error, loading, reload } = useAsync(
    (signal) =>
      resource.lookupOnly
        ? Promise.resolve(null)
        : api.get<unknown>(listUrl, { query: query as RequestOptions["query"], signal }),
    [listUrl, resource.lookupOnly, JSON.stringify(query)],
  );

  const allRows = useMemo(() => extractList(data, listDef?.listKey), [data, listDef?.listKey]);
  const count = extractCount(data, allRows.length);

  const rows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [allRows, search]);

  const rowId = resource.rowId ?? ((row: Record<string, unknown>) => String(row.id ?? ""));

  const rowActions: RowAction[] | undefined = resource.rowActions?.map((action) => ({
    key: action.key,
    label: action.label,
    danger: action.danger,
    onClick: (row) => run(action, { row, id: rowId(row) }, () => reload()),
  }));

  function handleCreate(values: FormValues) {
    if (!resource.create) return;
    setCreateBusy(true);
    api
      .post<unknown>(resource.create.url, values)
      .then((result) => {
        setCreating(false);
        reload();
        toast.success(resource.create?.successMessage ?? `${resource.singular} created.`);
        const payload = result as Record<string, unknown> | null;
        const revealKey = resource.create?.reveal;
        if (revealKey && payload && typeof payload[revealKey] === "string") {
          setReveal({ label: humanizeKey(revealKey), value: String(payload[revealKey]) });
          return;
        }
        const newId = payload && typeof payload.id === "string" ? payload.id : null;
        if (newId && resource.detail) {
          navigate(`${basePath(resource)}/${encodeURIComponent(newId)}`);
        }
      })
      .catch((err: unknown) => {
        toast.error(err instanceof ApiError ? err.message : "Creation failed.");
      })
      .finally(() => setCreateBusy(false));
  }

  return (
    <>
      <PageHeader
        title={resource.label}
        subtitle={resource.description}
        actions={
          <>
            {resource.listActions?.map((action: ActionDef) => (
              <button key={action.key} className="btn btn-secondary" onClick={() => run(action, {}, () => reload())}>
                <Icon name="play" size={15} /> {action.label}
              </button>
            ))}
            {resource.scopes?.length ? (
              <span className="badge badge-tone-neutral" title={`Requires: ${resource.scopes.join(", ")}`}>
                {resource.scopes.join(", ")}
              </span>
            ) : null}
            <button className="btn btn-secondary" onClick={() => reload()} title="Refresh">
              <Icon name="refresh-cw" size={15} />
            </button>
            {resource.create ? (
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <Icon name="plus" size={15} /> New {resource.singular}
              </button>
            ) : null}
          </>
        }
      />

      {resource.lookupOnly ? (
        <LookupPanel resource={resource} />
      ) : loading ? (
        <div className="card">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : resource.json ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Response</span>
            <span className="text-muted" style={{ fontSize: 12 }}>
              GET {listUrl}
            </span>
          </div>
          <div className="card-body">
            <JsonTree data={data} />
          </div>
        </div>
      ) : (
        <div className="card table-card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: 10 }}>
            <span className="card-title">
              {count} {resource.singular}
              {count === 1 ? "" : "s"}
            </span>
            <div className="flex gap-8 items-center" style={{ flexWrap: "wrap" }}>
              <label className="filter-search">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  placeholder={`Filter ${resource.label.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {rows.length > 0 ? (
                <button className="btn btn-secondary btn-sm" onClick={() => downloadCsv(`${resource.key}.csv`, rows)}>
                  <Icon name="database" size={14} /> Export
                </button>
              ) : null}
            </div>
          </div>

          {listDef?.query && listDef.query.length > 0 ? (
            <div className="card-body" style={{ paddingBottom: 0 }}>
              <div className="filter-bar">
                {listDef.query.map((q) => (
                  <label key={q.name} className="filter-field">
                    <span className="label">{q.label ?? q.name}</span>
                    {q.options ? (
                      <select
                        className="filter-select"
                        value={query[q.name] ?? ""}
                        onChange={(e) => setQuery((prev) => ({ ...prev, [q.name]: e.target.value }))}
                      >
                        <option value="">All</option>
                        {q.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="filter-select"
                        placeholder={q.placeholder ?? ""}
                        value={query[q.name] ?? ""}
                        onChange={(e) => setQuery((prev) => ({ ...prev, [q.name]: e.target.value }))}
                      />
                    )}
                  </label>
                ))}
                {Object.values(query).some((v) => v) ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => setQuery({})}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <DataTable
            rows={rows}
            columns={listDef?.columns}
            rowId={rowId}
            rowActions={rowActions}
            expandable
            onRowClick={
              resource.detail
                ? (row) => navigate(`${basePath(resource)}/${encodeURIComponent(rowId(row))}`)
                : undefined
            }
          />
        </div>
      )}

      {creating && resource.create ? (
        <Modal title={`New ${resource.singular}`} onClose={() => setCreating(false)} width={560}>
          <DynamicForm
            fields={resource.create.fields}
            busy={createBusy}
            submitLabel={`Create ${resource.singular}`}
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </Modal>
      ) : null}

      {reveal ? (
        <Modal title="Copy this value now" onClose={() => setReveal(null)} width={520}>
          <p className="text-secondary" style={{ marginBottom: 10 }}>
            This value is shown once and cannot be retrieved again.
          </p>
          <div className="form-field">
            <label className="form-label">{reveal.label}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-input form-input--mono"
                readOnly
                value={reveal.value}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigator.clipboard?.writeText(reveal.value).then(() => toast.success("Copied."))}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="modal__footer" style={{ margin: "8px -20px -20px", paddingLeft: 20, paddingRight: 20 }}>
            <button className="btn btn-secondary" onClick={() => setReveal(null)}>
              Done
            </button>
          </div>
        </Modal>
      ) : null}

      {actionNode}
    </>
  );
}

function LookupPanel({ resource }: { resource: ResourceDef }) {
  const navigate = useNavigate();
  const [id, setId] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (id.trim()) navigate(`${basePath(resource)}/${encodeURIComponent(id.trim())}`);
  }

  return (
    <div className="card">
      <div className="card-body">
        <p className="text-secondary" style={{ marginBottom: 12 }}>
          {resource.label} do not have a list endpoint. Enter an id to load one, or use{" "}
          <strong>Build</strong> to create/refresh a passport for a customer.
        </p>
        <form className="filter-bar" onSubmit={submit}>
          <label className="filter-search" style={{ maxWidth: 360 }}>
            <Icon name="search" size={15} />
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={`${resource.singular} id (e.g. psp_…)`}
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Open
          </button>
        </form>
        <p className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
          Tip: build a passport from a customer via <strong>New {resource.singular}</strong>; the response id opens the detail view.
        </p>
      </div>
    </div>
  );
}

export function basePath(resource: ResourceDef): string {
  return `/r/${resource.key}`;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([rowsToCsv(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { downloadCsv };
