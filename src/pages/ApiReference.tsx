import { useState } from "react";
import { ENDPOINT_COUNT, ENDPOINT_GROUPS, type EndpointItem } from "../lib/endpoints";
import { PageHeader } from "../components/PageHeader";
import { RequestConsole } from "../components/RequestConsole";
import { Icon } from "../components/Icon";
import { API_BASE_URL } from "../lib/api";

export function ApiReferencePage() {
  const [active, setActive] = useState<EndpointItem | null>(null);
  const [filter, setFilter] = useState("");

  const groups = ENDPOINT_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        !filter.trim() ||
        `${i.method} ${i.path} ${i.title} ${i.desc}`.toLowerCase().includes(filter.toLowerCase()),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        title="API Reference"
        subtitle={
          <>
            All {ENDPOINT_COUNT} operations across {ENDPOINT_GROUPS.length} groups. Base URL{" "}
            <span className="text-mono">{API_BASE_URL}</span>. Click any operation to send it with your current session.
          </>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body flex items-center gap-12" style={{ flexWrap: "wrap" }}>
          <label className="filter-search" style={{ maxWidth: 420 }}>
            <Icon name="search" size={15} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter operations by method, path or name…"
            />
          </label>
          <span className="text-muted" style={{ fontSize: 12 }}>
            {groups.reduce((n, g) => n + g.items.length, 0)} shown
          </span>
        </div>
      </div>

      <div className="section-stack">
        {groups.map((group) => (
          <div className="card" key={group.group}>
            <div className="card-header">
              <span className="card-title">{group.group}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {group.items.length} operation{group.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="card-body">
              {group.items.map((item) => (
                <div className="endpoint-row" key={item.id}>
                  <span className={`method-pill method-${item.method}`}>{item.method}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-8" style={{ flexWrap: "wrap" }}>
                      <span className="path-mono">{item.path}</span>
                      {!item.auth ? <span className="badge badge-tone-neutral">public</span> : null}
                      {item.scopes.map((s) => (
                        <span className="badge badge-tone-info" key={s}>
                          {s}
                        </span>
                      ))}
                      {item.roles.map((r) => (
                        <span className="badge badge-tone-purple" key={r}>
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="text-secondary" style={{ fontSize: 12.5, marginTop: 3 }}>
                      <strong>{item.title}</strong> — {item.desc}
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActive(item)}>
                    <Icon name="play" size={13} /> Try
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {active ? <RequestConsole endpoint={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}
