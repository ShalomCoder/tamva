import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Icon } from "../components/Icon";

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({
    institution_name: "",
    institution_slug: "",
    name: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ institution_id: string; email: string } | null>(null);

  function update(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form, institution_slug: form.institution_slug.trim() || undefined };
      const res = await authApi.register(payload);
      setCreated({ institution_id: res.institution_id, email: res.email });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <main className="auth-shell" style={{ gridTemplateColumns: "1fr" }}>
        <section className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <p className="eyebrow">Institution created</p>
              <h2>You're all set</h2>
              <p>Your institution and first administrator were created successfully.</p>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div className="label">Institution ID</div>
              <div className="text-mono" style={{ marginBottom: 12 }}>
                {created.institution_id}
              </div>
              <div className="label">Admin email</div>
              <div className="text-mono">{created.email}</div>
            </div>
            <button
              className="btn btn-primary auth-submit"
              style={{ marginTop: 18 }}
              onClick={async () => {
                await auth.login(form.email, form.password).catch(() => undefined);
                navigate("/");
              }}
            >
              Sign in <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell" style={{ gridTemplateColumns: "1fr" }}>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <p className="eyebrow">Get started</p>
            <h2>Register an institution</h2>
            <p>Create a tenant and its first administrator account.</p>
          </div>
          {error ? (
            <div className="auth-state" role="alert" style={{ display: "flex" }}>
              <Icon name="alert-triangle" size={15} /> {error}
            </div>
          ) : null}
          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label htmlFor="institution_name">Institution name</label>
              <div className="auth-input-wrap">
                <Icon name="building-2" size={15} />
                <input
                  id="institution_name"
                  value={form.institution_name}
                  onChange={(e) => update("institution_name", e.target.value)}
                  placeholder="My Bank"
                  required
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="institution_slug">Institution slug (optional)</label>
              <div className="auth-input-wrap">
                <Icon name="terminal" size={15} />
                <input
                  id="institution_slug"
                  value={form.institution_slug}
                  onChange={(e) => update("institution_slug", e.target.value)}
                  placeholder="my-bank"
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="name">Your name</label>
              <div className="auth-input-wrap">
                <Icon name="user" size={15} />
                <input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="reg-email">Work email</label>
              <div className="auth-input-wrap">
                <Icon name="mail" size={15} />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="reg-password">Password (min 10 characters)</label>
              <div className="auth-input-wrap">
                <Icon name="lock" size={15} />
                <input
                  id="reg-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  minLength={10}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
              <span>{busy ? "Creating…" : "Create institution"}</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </form>
          <p className="auth-legal">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
