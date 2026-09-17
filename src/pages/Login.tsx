import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { Icon } from "../components/Icon";

type Mode = "user" | "partner";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("user");
  const [email, setEmail] = useState(import.meta.env.VITE_DEFAULT_EMAIL ?? "admin@tamva.local");
  const [password, setPassword] = useState(import.meta.env.VITE_DEFAULT_PASSWORD ?? "StrongPass123!");
  const [clientId, setClientId] = useState("app_demo");
  const [clientSecret, setClientSecret] = useState("demo-secret-123!");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "user") await auth.login(email.trim(), password);
      else await auth.loginClient(clientId.trim(), clientSecret);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed. Check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel" aria-label="About TAMVA">
        <div className="auth-brand">
          <span className="auth-brand__mark">TM</span>
          <span>
            <strong>TAMVA</strong>
            <small>Trust Platform</small>
          </span>
        </div>
        <div className="auth-brand-copy">
          <p className="eyebrow">Financial infrastructure for trust</p>
          <h1>Make every financial decision more explainable.</h1>
          <p>
            TAMVA connects transaction intelligence, behavioural signals, and consented financial identity into one
            operating view for institutions.
          </p>
        </div>
        <div className="auth-proof">
          <span>
            <Icon name="shield-check" size={14} /> Explainable risk
          </span>
          <span>
            <Icon name="fingerprint" size={14} /> Portable identity
          </span>
          <span>
            <Icon name="lock-keyhole" size={14} /> Consent first
          </span>
        </div>
        <div className="auth-brand-footer">
          <span>Trusted operating view</span>
          <span>v1.0 · Live API</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand__mark">TM</span>
            <strong>TAMVA</strong>
          </div>
          <div className="auth-form-heading">
            <p className="eyebrow">{mode === "user" ? "Institution access" : "Partner application"}</p>
            <h2>Welcome back</h2>
            <p>Sign in to your TAMVA workspace.</p>
          </div>

          <div className="flex gap-8" style={{ marginBottom: 18 }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === "user" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("user")}
            >
              User login
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === "partner" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("partner")}
            >
              Client credentials
            </button>
          </div>

          {error ? (
            <div className="auth-state" role="alert" style={{ display: "flex" }}>
              <Icon name="alert-triangle" size={15} /> {error}
            </div>
          ) : null}

          <form onSubmit={submit} noValidate>
            {mode === "user" ? (
              <>
                <div className="auth-field">
                  <label htmlFor="email">Work email</label>
                  <div className="auth-input-wrap">
                    <Icon name="mail" size={15} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="you@institution.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="password">Password</label>
                  <div className="auth-input-wrap">
                    <Icon name="lock" size={15} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      <Icon name={showPassword ? "eye-off" : "eye"} size={15} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="auth-field">
                  <label htmlFor="clientId">Client ID</label>
                  <div className="auth-input-wrap">
                    <Icon name="key-round" size={15} />
                    <input
                      id="clientId"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="app_demo"
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="clientSecret">Client secret</label>
                  <div className="auth-input-wrap">
                    <Icon name="lock" size={15} />
                    <input
                      id="clientSecret"
                      type={showPassword ? "text" : "password"}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="demo-secret-123!"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
              <span>{busy ? "Signing in…" : "Sign in"}</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </form>

          <div className="auth-demo-note">
            <Icon name="info" size={14} />
            <span>
              Demo admin: <code>admin@tamva.local</code> / <code>StrongPass123!</code>
            </span>
          </div>
          <p className="auth-legal">
            Need an account? <Link to="/register" className="auth-link">Register an institution</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
