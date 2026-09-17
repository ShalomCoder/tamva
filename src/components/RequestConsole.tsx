import { useMemo, useState } from "react";
import { api, API_BASE_URL, ApiError } from "../lib/api";
import type { EndpointItem } from "../lib/endpoints";
import { humanizeKey } from "../lib/format";
import { Modal } from "./Modal";
import { JsonTree } from "./JsonTree";

interface ResponseState {
  ok: boolean;
  status: number;
  ms: number;
  body: unknown;
}

export function RequestConsole({ endpoint, onClose }: { endpoint: EndpointItem; onClose: () => void }) {
  const [params, setParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(endpoint.params.map((p) => [p, p === "appId" || p === "customerId" ? "" : ""])),
  );
  const [query, setQuery] = useState<Record<string, string>>(() => Object.fromEntries(endpoint.query.map((q) => [q, ""])));
  const [body, setBody] = useState<string>(() => (endpoint.body ? JSON.stringify(endpoint.body, null, 2) : ""));
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const resolvedPath = useMemo(() => {
    let path = endpoint.path;
    for (const p of endpoint.params) {
      path = path.replace(`:${p}`, encodeURIComponent(params[p] || `:${p}`));
    }
    return path;
  }, [endpoint, params]);

  async function send() {
    setBusy(true);
    setResponse(null);
    setBodyError(null);

    let parsedBody: unknown;
    if (body.trim()) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setBodyError("Body is not valid JSON");
        setBusy(false);
        return;
      }
    }

    const options = { query, body: parsedBody };
    const started = performance.now();
    try {
      let result: unknown;
      const method = endpoint.method.toUpperCase();
      if (method === "GET") result = await api.get(resolvedPath, options);
      else if (method === "POST") result = await api.post(resolvedPath, parsedBody, { query });
      else if (method === "PATCH") result = await api.patch(resolvedPath, parsedBody, { query });
      else if (method === "PUT") result = await api.put(resolvedPath, parsedBody, { query });
      else result = await api.del(resolvedPath, { query });
      setResponse({ ok: true, status: 200, ms: Math.round(performance.now() - started), body: result });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, null, "Request failed");
      setResponse({
        ok: false,
        status: apiErr.status,
        ms: Math.round(performance.now() - started),
        body: { error: { code: apiErr.code, message: apiErr.message, details: apiErr.details } },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`${endpoint.method} ${endpoint.path}`} onClose={onClose} width={680}>
      <p className="text-secondary" style={{ marginBottom: 14 }}>
        {endpoint.desc}
      </p>
      <div className="flex gap-8 items-center" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <span className={`method-pill method-${endpoint.method}`}>{endpoint.method}</span>
        <span className="path-mono">{resolvedPath}</span>
        <span className="text-muted" style={{ fontSize: 11 }}>
          base {API_BASE_URL}
        </span>
      </div>

      {endpoint.params.length > 0 ? (
        <div className="stack-form" style={{ marginBottom: 12 }}>
          {endpoint.params.map((p) => (
            <div className="form-field" key={p}>
              <label className="form-label">:{p}</label>
              <input
                className="form-input"
                value={params[p] ?? ""}
                onChange={(e) => setParams((prev) => ({ ...prev, [p]: e.target.value }))}
                placeholder={p}
              />
            </div>
          ))}
        </div>
      ) : null}

      {endpoint.query.length > 0 ? (
        <div className="stack-form" style={{ marginBottom: 12 }}>
          {endpoint.query.map((q) => (
            <div className="form-field" key={q}>
              <label className="form-label">{humanizeKey(q)} (query)</label>
              <input
                className="form-input"
                value={query[q] ?? ""}
                onChange={(e) => setQuery((prev) => ({ ...prev, [q]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      ) : null}

      {endpoint.body !== null || ["POST", "PATCH", "PUT"].includes(endpoint.method) ? (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Request body (JSON)</label>
          <textarea
            className="form-input form-input--mono"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {bodyError ? <small className="form-error">{bodyError}</small> : null}
        </div>
      ) : null}

      <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
        <button className="btn btn-primary" onClick={() => void send()} disabled={busy}>
          {busy ? "Sending…" : "Send request"}
        </button>
      </div>

      {response ? (
        <div style={{ marginTop: 16 }}>
          <div className="flex items-center gap-8" style={{ marginBottom: 8 }}>
            <span className={`badge badge-tone-${response.ok ? "low" : "high"}`}>{response.status || "ERR"}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {response.ms} ms
            </span>
          </div>
          <div className="card" style={{ background: "var(--surface-secondary)" }}>
            <div className="card-body" style={{ maxHeight: 320, overflow: "auto" }}>
              <JsonTree data={response.body} />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
