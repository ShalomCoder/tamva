import { useAuth } from "../lib/auth";
import { PageHeader } from "../components/PageHeader";
import { API_BASE_URL } from "../lib/api";
import { titleCase } from "../lib/format";
import { Link } from "react-router-dom";
import { ENDPOINT_COUNT } from "../lib/endpoints";

export function SettingsPage() {
  const auth = useAuth();
  const actor = auth.actor;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Your session, granted scopes and the runtime configuration used by this client."
      />

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Session</span>
          </div>
          <div className="card-body">
            <dl className="detail-list" style={{ gridTemplateColumns: "1fr" }}>
              <Row label="Actor ID" value={<span className="text-mono">{actor?.actor_id ?? "—"}</span>} />
              <Row label="Actor type" value={actor?.actor_type ?? "—"} />
              <Row label="Email" value={actor?.email ?? "—"} />
              <Row label="Client ID" value={actor?.app_client_id ?? "—"} />
              <Row
                label="Institution"
                value={<span className="text-mono">{actor?.institution_id ?? "platform"}</span>}
              />
              <Row label="Roles" value={actor?.roles?.map(titleCase).join(", ") || "—"} />
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Runtime</span>
          </div>
          <div className="card-body">
            <dl className="detail-list" style={{ gridTemplateColumns: "1fr" }}>
              <Row label="API base URL" value={<span className="text-mono">{API_BASE_URL}</span>} />
              <Row label="Documented operations" value={String(ENDPOINT_COUNT)} />
              <Row label="API reference" value={<Link to="/api-reference" className="auth-link">Open explorer</Link>} />
            </dl>
            <button
              className="btn btn-danger"
              style={{ marginTop: 16 }}
              onClick={() => {
                auth.logout();
                window.location.hash = "#/login";
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Granted scopes ({actor?.scopes?.length ?? 0})</span>
          </div>
          <div className="card-body flex gap-8" style={{ flexWrap: "wrap" }}>
            {(actor?.scopes ?? []).map((s) => (
              <span className="badge badge-tone-info" key={s}>
                {s}
              </span>
            ))}
            {(actor?.scopes?.length ?? 0) === 0 ? <span className="text-secondary">No scopes on this token.</span> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="detail-item">
      <dt className="label">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
