/**
 * TAMVA API client
 * -----------------------------------------------------------------------
 * Single point of contact with the backend. Mirrors the real Fastify API
 * (flat response bodies, single `{ error: { code, message, request_id,
 * details } }` envelope). Every request attaches the bearer token when one
 * is present.
 *
 * Configure with VITE_API_BASE_URL:
 *   /api (default)                  -> proxied by Vite to VITE_PROXY_TARGET
 *   https://tamva.onrender.com      -> direct (backend must allow CORS)
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiActor {
  actor_id: string;
  actor_type: string;
  institution_id: string | null;
  roles: string[];
  scopes: string[];
  email?: string | null;
  app_client_id?: string | null;
}

export interface ApiDetail {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  request_id?: string;
  details?: ApiDetail[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiDetail[];
  readonly requestId?: string;

  constructor(status: number, body: Partial<ApiErrorBody> | null, fallback: string) {
    const message = body?.message || fallback || `Request failed with status ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code || `HTTP_${status}`;
    this.details = body?.details ?? [];
    this.requestId = body?.request_id;
  }
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api";

const TOKEN_KEY = "tamva.token";
const ACTOR_KEY = "tamva.actor";

let memoryToken: string | null = readStoredToken();

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return memoryToken;
}

export function getStoredActor(): ApiActor | null {
  try {
    const raw = localStorage.getItem(ACTOR_KEY);
    return raw ? (JSON.parse(raw) as ApiActor) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, actor: ApiActor): void {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ACTOR_KEY, JSON.stringify(actor));
  } catch {
    /* storage unavailable — token still valid for this session */
  }
}

export function clearSession(): void {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTOR_KEY);
  } catch {
    /* ignore */
  }
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, auth = true, signal, headers = {} } = options;
  const token = getToken();

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, null, "Network error — could not reach the TAMVA API.");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const envelope = (parsed as { error?: ApiErrorBody } | null)?.error ?? null;
    if (res.status === 401 && auth) clearSession();
    throw new ApiError(res.status, envelope, `Request failed (${res.status})`);
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body: body ?? {} }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body: body ?? {} }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body: body ?? {} }),
  del: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

// -------------------- health --------------------

export interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

export const healthApi = {
  health: () => request<HealthResponse>("GET", "/health", { auth: false }),
  ready: () => request<HealthResponse>("GET", "/ready", { auth: false }),
};

// -------------------- auth --------------------

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  actor: ApiActor;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("POST", "/v1/auth/login", { auth: false, body: { email, password } }),
  loginClient: (clientId: string, clientSecret: string) =>
    request<LoginResponse>("POST", "/v1/auth/client", {
      auth: false,
      body: { client_id: clientId, client_secret: clientSecret },
    }),
  register: (input: {
    institution_name: string;
    institution_slug?: string;
    name: string;
    email: string;
    password: string;
  }) =>
    request<{ institution_id: string; institution_name: string; user_id: string; email: string; role: string }>(
      "POST",
      "/v1/auth/register",
      { auth: false, body: input },
    ),
  me: () => request<{ actor: ApiActor }>("GET", "/v1/auth/me"),
};

// -------------------- generic helpers --------------------

/** Pull the first array-valued property out of a flat list response. */
export function extractList(payload: unknown, preferredKey?: string): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (preferredKey && Array.isArray(obj[preferredKey])) {
      return obj[preferredKey] as Record<string, unknown>[];
    }
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) return value as Record<string, unknown>[];
    }
  }
  return [];
}

/** Count companion returned by list endpoints (`{ ... , count }`). */
export function extractCount(payload: unknown, listLength: number): number {
  if (payload && typeof payload === "object") {
    const count = (payload as Record<string, unknown>).count;
    if (typeof count === "number") return count;
  }
  return listLength;
}
