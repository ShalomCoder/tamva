import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, extractList } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { humanizeKey } from "../lib/format";
import { resourceByKey, type RelatedDef, type ResourceDef } from "../lib/resources";
import { PageHeader } from "./PageHeader";
import { ErrorState, LoadingState } from "./StateBlock";
import { FieldValue } from "./FieldValue";
import { JsonTree } from "./JsonTree";
import { DataTable } from "./DataTable";
import { useActionRunner } from "./ActionRunner";
import { basePath } from "./ResourceListPage";
import { Icon } from "./Icon";

export function ResourceDetailPage() {
  const { key = "", id = "" } = useParams();
  const resource = resourceByKey(key);
  const decodedId = decodeURIComponent(id);

  if (!resource || !resource.detail) {
    return (
      <div className="card">
        <ErrorState error={{ name: "ApiError", message: `No detail view for '${key}'.`, status: 404, code: "NOT_FOUND", details: [] } as never} />
      </div>
    );
  }

  return <DetailBody key={resource.key} resource={resource} id={decodedId} />;
}

function DetailBody({ resource, id }: { resource: ResourceDef; id: string }) {
  const navigate = useNavigate();
  const { run, node: actionNode } = useActionRunner();
  const detail = resource.detail!;

  const { data, error, loading, reload } = useAsync(
    (signal) => api.get<Record<string, unknown>>(detail.url(id), { signal }),
    [detail.url, id],
  );

  const { scalars, collections } = useMemo(() => splitFields(data), [data]);

  const title =
    data && detail.titleKey && data[detail.titleKey] != null
      ? String(data[detail.titleKey])
      : `${resource.singular} ${id}`;

  return (
    <>
      <PageHeader
        back={
          <Link to={basePath(resource)} className="text-secondary flex items-center gap-8" style={{ fontSize: 13, marginBottom: 8 }}>
            <Icon name="chevron-left" size={14} /> {resource.label}
          </Link>
        }
        title={title}
        subtitle={<span className="text-mono text-secondary">{id}</span>}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => reload()}>
              <Icon name="refresh-cw" size={15} /> Refresh
            </button>
            {resource.actions?.map((action) => (
              <button
                key={action.key}
                className={`btn ${action.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() =>
                  run(action, { id }, (result) => {
                    const payload = result as Record<string, unknown> | null;
                    const nextId = payload && typeof payload.id === "string" ? payload.id : null;
                    if (nextId && resource.detail) navigate(`${basePath(resource)}/${encodeURIComponent(nextId)}`);
                    else reload();
                  })
                }
              >
                {action.label}
              </button>
            ))}
          </>
        }
      />

      {loading ? (
        <div className="card">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : (
        <div className="detail-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Details</span>
            </div>
            <div className="card-body">
              <dl className="detail-list">
                {scalars.map(([field, value]) => (
                  <div className="detail-item" key={field}>
                    <dt className="label">{humanizeKey(field)}</dt>
                    <dd>
                      <FieldValue field={field} value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {collections.map(([field, value]) => (
            <div className="card" key={field}>
              <div className="card-header">
                <span className="card-title">{humanizeKey(field)}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {Array.isArray(value) ? `${value.length} item${value.length === 1 ? "" : "s"}` : "object"}
                </span>
              </div>
              <div className="card-body">
                {Array.isArray(value) && value.length > 0 && value.every((v) => v && typeof v === "object") ? (
                  <DataTable rows={value as Record<string, unknown>[]} rowId={(row) => String(row.id ?? JSON.stringify(row))} />
                ) : (
                  <JsonTree data={value} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail.related?.map((related) => (
        <RelatedSection key={related.label} related={related} id={id} />
      ))}

      {actionNode}
    </>
  );
}

function RelatedSection({ related, id }: { related: RelatedDef; id: string }) {
  const { run, node } = useActionRunner();
  const { data, error, loading, reload } = useAsync(
    (signal) => api.get<unknown>(related.url(id), { signal }),
    [related.url, id],
  );
  const rows = extractList(data, related.listKey);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <span className="card-title">{related.label}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => reload()}>
          <Icon name="refresh-cw" size={14} />
        </button>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <div className="state-block" style={{ padding: 28 }}>
          <p className="text-secondary">No {related.label.toLowerCase()} available.</p>
        </div>
      ) : (
        <DataTable
          rows={rows}
          columns={related.columns}
          rowId={(row) => String(row.id ?? JSON.stringify(row).slice(0, 40))}
          rowActions={related.rowActions?.map((action) => ({
            key: action.key,
            label: action.label,
            danger: action.danger,
            onClick: (row) => run(action, { row, id: String(row.id ?? "") }, () => reload()),
          }))}
        />
      )}
      {node}
    </div>
  );
}

function splitFields(data: Record<string, unknown> | null): {
  scalars: Array<[string, unknown]>;
  collections: Array<[string, unknown]>;
} {
  if (!data) return { scalars: [], collections: [] };
  const scalars: Array<[string, unknown]> = [];
  const collections: Array<[string, unknown]> = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && typeof v === "object") collections.push([k, v]);
    else scalars.push([k, v]);
  }
  return { scalars, collections };
}
