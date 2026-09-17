import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, clearSession, getStoredActor, getToken, setSession, type ApiActor } from "./api";

interface AuthContextValue {
  actor: ApiActor | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<ApiActor>;
  loginClient: (clientId: string, clientSecret: string) => Promise<ApiActor>;
  logout: () => void;
  hasScope: (scope: string) => boolean;
  hasAnyScope: (scopes: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [actor, setActor] = useState<ApiActor | null>(getStoredActor());
  const [token, setTokenState] = useState<string | null>(getToken());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const res = await authApi.me();
        if (cancelled) return;
        setActor(res.actor);
        setTokenState(getToken());
      } catch {
        clearSession();
        if (!cancelled) {
          setActor(null);
          setTokenState(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setSession(res.token, res.actor);
    setActor(res.actor);
    setTokenState(res.token);
    return res.actor;
  }, []);

  const loginClient = useCallback(async (clientId: string, clientSecret: string) => {
    const res = await authApi.loginClient(clientId, clientSecret);
    setSession(res.token, res.actor);
    setActor(res.actor);
    setTokenState(res.token);
    return res.actor;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setActor(null);
    setTokenState(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const scopes = new Set(actor?.scopes ?? []);
    const roles = new Set(actor?.roles ?? []);
    return {
      actor,
      token,
      ready,
      login,
      loginClient,
      logout,
      hasScope: (scope: string) => scopes.has(scope),
      hasAnyScope: (list: string[]) => list.length === 0 || list.some((s) => scopes.has(s)),
      hasRole: (role: string) => roles.has(role),
    };
  }, [actor, token, ready, login, loginClient, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
