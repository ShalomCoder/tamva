import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import { AppShell } from "./components/AppShell";
import { PlatformShell } from "./components/PlatformShell";
import { ResourceListPage } from "./components/ResourceListPage";
import { ResourceDetailPage } from "./components/ResourceDetailPage";
import { LoadingState } from "./components/StateBlock";
import { resourceByKey } from "./lib/resources";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { AnalyticsPage } from "./pages/Analytics";
import { ApiReferencePage } from "./pages/ApiReference";
import { SearchPage } from "./pages/Search";
import { SettingsPage } from "./pages/Settings";
import { AdminPage } from "./pages/Admin";
import { NotFoundPage } from "./pages/NotFound";

function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <LoadingState text="Restoring session…" />
      </div>
    );
  }
  if (!auth.actor) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const auth = useAuth();
  if (!auth.actor || !roles.some((r) => auth.actor?.roles?.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function ResourceListRoute() {
  const { key = "" } = useParams();
  const resource = resourceByKey(key);
  if (!resource) return <NotFoundPage />;
  return <ResourceListPage key={resource.key} resource={resource} />;
}

function AppRoutes() {
  const auth = useAuth();
  const isPlatformAdmin = auth.hasRole("INTERNAL_ADMIN");

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth>{isPlatformAdmin ? <PlatformShell /> : <AppShell />}</RequireAuth>}>
        <Route
          path="/"
          element={isPlatformAdmin ? <Navigate to="/admin" replace /> : <DashboardPage />}
        />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/api-reference" element={<ApiReferencePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/admin"
          element={
            <RequireRole roles={["INTERNAL_ADMIN"]}>
              <AdminPage />
            </RequireRole>
          }
        />
        <Route path="/r/:key" element={<ResourceListRoute />} />
        <Route path="/r/:key/:id" element={<ResourceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
