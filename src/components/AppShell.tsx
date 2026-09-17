import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NAV } from "../lib/nav";
import { initialsOf } from "../lib/format";
import { Icon } from "./Icon";

function useEnvironment(): [string, (v: string) => void] {
  const [env, setEnv] = useState<string>(() => {
    try {
      return localStorage.getItem("tamva.env") ?? "sandbox";
    } catch {
      return "sandbox";
    }
  });
  const update = (v: string) => {
    setEnv(v);
    try {
      localStorage.setItem("tamva.env", v);
    } catch {
      /* ignore */
    }
  };
  return [env, update];
}

export function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [env, setEnv] = useEnvironment();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenDropdown(null);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const actor = auth.actor;
  const displayName = actor?.email ?? actor?.app_client_id ?? actor?.actor_id ?? "Unknown";
  const role = actor?.roles?.[0] ?? actor?.actor_type ?? "USER";

  const groups = useMemo(() => {
    return NAV.map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (item.roles && item.roles.length > 0) {
          if (!item.roles.some((r) => actor?.roles?.includes(r))) return false;
        }
        if (item.scopes && item.scopes.length > 0) {
          if (!auth.hasAnyScope(item.scopes)) return false;
        }
        return true;
      }),
    })).filter((g) => g.items.length > 0);
  }, [actor, auth]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <div className="app-shell" ref={rootRef}>
      <div className={`sidebar__scrim${menuOpen ? " is-visible" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="sidebar__brand">
          <div className="sidebar__mark">TM</div>
          <div className="sidebar__brand-text">
            <div className="name">TAMVA</div>
            <div className="tagline">Trust Platform</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {groups.map((g) => (
            <div className="nav-group" key={g.group}>
              <div className="nav-group__label">{g.group}</div>
              {g.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className="demo-notice">
            <Icon name="info" size={13} /> {env === "production" ? "Production workspace" : "Sandbox workspace"}
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="flex items-center gap-16">
            <button className="menu-toggle icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Icon name="menu" size={18} />
            </button>
            <form onSubmit={submitSearch}>
              <label className="topbar__search">
                <Icon name="search" size={16} />
                <input
                  type="search"
                  placeholder="Search customers, transactions, cases…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </form>
          </div>
          <div className="topbar__actions">
            <div className={`env-indicator ${env}`}>
              <span className="env-indicator__dot" />
              <span>{env === "production" ? "Production" : "Sandbox"}</span>
            </div>

            <div className="dropdown">
              <button className="icon-btn" onClick={() => setOpenDropdown(openDropdown === "notif" ? null : "notif")} aria-label="Notifications">
                <Icon name="bell" size={18} />
              </button>
              {openDropdown === "notif" ? (
                <div className="dropdown__menu notif-panel">
                  <div className="notif-panel__header">Notifications</div>
                  <div className="notif-panel__body">
                    <div className="state-block" style={{ padding: "28px 16px" }}>
                      <div className="state-block__icon">
                        <Icon name="inbox" size={18} />
                      </div>
                      <p className="state-block__title">You're all caught up</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="dropdown">
              <button className="user-chip" onClick={() => setOpenDropdown(openDropdown === "user" ? null : "user")}>
                <span className="user-chip__avatar">{initialsOf(displayName)}</span>
                <span className="flex-col" style={{ alignItems: "flex-start", maxWidth: 160 }}>
                  <span className="user-chip__name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName}
                  </span>
                  <span className="user-chip__role">{role}</span>
                </span>
                <Icon name="chevron-down" size={14} />
              </button>
              {openDropdown === "user" ? (
                <div className="dropdown__menu">
                  <div className="dropdown__item" style={{ cursor: "default" }}>
                    <Icon name="fingerprint" size={15} />
                    <span className="text-mono" style={{ fontSize: 11 }}>
                      {actor?.institution_id ?? "platform"}
                    </span>
                  </div>
                  <div className="dropdown__item" style={{ cursor: "default" }}>
                    <Icon name="key-round" size={15} /> {actor?.scopes?.length ?? 0} scopes
                  </div>
                  <div className="dropdown__item" style={{ cursor: "default" }}>
                    <Icon name="shield" size={15} /> {actor?.roles?.join(", ") || "—"}
                  </div>
                  <div className="dropdown__divider" />
                  <button className="dropdown__item" onClick={() => setEnv(env === "production" ? "sandbox" : "production")}>
                    <Icon name="repeat" size={15} /> Switch to {env === "production" ? "sandbox" : "production"}
                  </button>
                  <Link className="dropdown__item" to="/settings">
                    <Icon name="settings" size={15} /> Settings
                  </Link>
                  <div className="dropdown__divider" />
                  <button
                    className="dropdown__item"
                    onClick={() => {
                      auth.logout();
                      navigate("/login");
                    }}
                  >
                    <Icon name="log-out" size={15} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
