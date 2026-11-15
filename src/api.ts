import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
export type Mode = "customer" | "employee";
export interface Profile {
  id: string;
  description?: string;
  name?: string;
  rating?: number;
  reviewsCount?: number;
  user?: { name: string };
}
export interface User {
  id: string;
  email: string;
  name: string;
  roles: Mode[];
  mode: Mode;
  employeeProfile?: Profile;
}
export interface AuthResponse {
  accessToken: string;
}
export interface RegisterResponse {
  message: string;
}
export interface Session {
  accessToken: string;
  user: User;
  mode?: Mode;
}
export interface Option {
  id: string;
  name: string;
  description?: string;
  price?: number;
}
export interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt?: string;
  customer?: { name: string };
}
export interface Contract {
  id: string;
  title: string;
  description: string;
  serviceTypeId: string;
  regionId: string;
  positionX: number;
  positionY: number;
  date: string;
  budget: number;
  status: string;
  employeeId?: string | null;
  employee?: Profile;
  serviceType?: Option;
  region?: Option;
  review?: Review | null;
  proposalsCount?: number;
  _count?: { proposals: number };
}
export interface Proposal {
  id: string;
  price: number;
  comment: string;
  status: string;
  employee?: Profile;
  employeeProfile?: Profile;
  contract?: Contract;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
export interface EmployeeInput {
  description: string;
  specializationIds: string[];
  regionIds: string[];
}
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: Mode;
  employeeProfile?: EmployeeInput;
}
export interface ContractInput {
  title: string;
  description: string;
  serviceTypeId: string;
  regionId: string;
  positionX: number;
  positionY: number;
  date: string;
  budget: number;
}
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export const configured = Boolean(import.meta.env.VITE_API_URL);
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
const auth = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
let token: string | null = null;
let refreshPromise: Promise<Session> | null = null;
let sessionListener: (s: Session | null) => void = () => {};
export const listenSession = (fn: typeof sessionListener) => {
  sessionListener = fn;
  return () => {
    sessionListener = () => {};
  };
};
export function applySession(s: Session | null) {
  token = s?.accessToken ?? null;
  sessionListener(s);
}
function normalizeUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.split("?")[0];
  if (/^https?:\/\//i.test(trimmed)) return new URL(trimmed).pathname;
  return trimmed;
}
function isMode(value: unknown): value is Mode {
  return value === "customer" || value === "employee";
}
export async function hydrateSession(response: AuthResponse): Promise<Session> {
  const part = response.accessToken.split(".")[1];
  if (!part) throw new Error("Некоректний access token");
  const payload: unknown = JSON.parse(
    atob(part.replace(/-/g, "+").replace(/_/g, "/")),
  );
  const roleCandidates =
    payload && typeof payload === "object"
      ? [
          "role" in payload ? payload.role : undefined,
          "mode" in payload ? payload.mode : undefined,
          "roles" in payload && Array.isArray(payload.roles)
            ? payload.roles
            : undefined,
        ].flat()
      : [];
  const roles = roleCandidates.filter(isMode);
  if (
    !payload ||
    typeof payload !== "object" ||
    !("sub" in payload) ||
    typeof payload.sub !== "string" ||
    !roles.length
  )
    throw new Error("Некоректна сесія");
  const mode = roles[0];
  return {
    accessToken: response.accessToken,
    user: {
      id: payload.sub,
      email: "",
      name: "Користувач",
      mode,
      roles,
    },
    mode,
  };
}
export function refresh() {
  if (!refreshPromise)
    refreshPromise = auth
      .post<AuthResponse>("/auth/refresh")
      .then(async (r) => {
        const s = await hydrateSession(r.data);
        applySession(s);
        return s;
      })
      .catch((e: unknown) => {
        if (
          axios.isAxiosError(e) &&
          [401, 403].includes(e.response?.status ?? 0)
        )
          applySession(null);
        throw e;
      })
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
}
function publicPath(url = "") {
  const path = normalizeUrl(url);
  return (
    /^(\/services|\/regions)(\/|$)/.test(path) ||
    /^\/auth\/(login|register|refresh|verify-email|resend-verification)(\/|$)/.test(
      path,
    )
  );
}
api.interceptors.request.use((c) => {
  if (token && !publicPath(c.url)) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
api.interceptors.response.use(
  async (r) => {
    const path = normalizeUrl(r.config.url);
    if (
      /^\/auth\/(login|switch-mode|roles\/(customer|employee))$/.test(path)
    ) {
      r.data = await hydrateSession(r.data as AuthResponse);
    }
    return r;
  },
  async (e: AxiosError) => {
    const c = e.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (e.response?.status !== 401 || !c || c._retried || publicPath(c.url))
      return Promise.reject(e);
    c._retried = true;
    try {
      const s = await refresh();
      c.headers.Authorization = `Bearer ${s.accessToken}`;
      return api(c);
    } catch (error) {
      return Promise.reject(error);
    }
  },
);
export function errorText(e: unknown) {
  const response =
    typeof e === "object" && e !== null && "response" in e
      ? (e as { response?: { status?: number; data?: { message?: string | string[] } } }).response
      : undefined;
  const config =
    typeof e === "object" && e !== null && "config" in e
      ? (e as { config?: { url?: string } }).config
      : undefined;
  if (response && typeof response === "object") {
    const status = response.status;
    const url = normalizeUrl(config?.url);
    const m = response.data?.message;
    if (status === 401 && /\/auth\/login(\/|$)/.test(url))
      return "Невірний email або пароль.";
    if ((status === 401 || status === 403) && /\/auth\/(refresh)(\/|$)/.test(url))
      return "Сесію завершено. Увійдіть знову.";
    if (status === 403 && /\/auth\/login(\/|$)/.test(url))
      return m
        ? Array.isArray(m)
          ? m.join(" • ")
          : m
        : "Підтвердіть електронну пошту перед входом.";
    if (status === 403) return "Ця дія недоступна у вашому поточному режимі.";
    if (status === 401)
      return "Неавторизовано. Увійдіть знову.";
    if (status === 404 && typeof m === "string" && /^Cannot (GET|POST|DELETE) \/(cemeteries|plots)/.test(m))
      return "Цей маршрут кладовищ або місць наразі недоступний на сервері. Решта розділів сайту може працювати; перевірте адресу API або зверніться до розробника бекенду.";
    if (m) return Array.isArray(m) ? m.join(" • ") : m;
    return "Не вдалося зв’язатися із сервером. Спробуйте ще раз.";
  }
  return e instanceof Error ? e.message : "Сталася помилка. Спробуйте ще раз.";
}
export function isEmailVerificationError(e: unknown) {
  const response =
    typeof e === "object" && e !== null && "response" in e
      ? (e as { response?: { status?: number } }).response
      : undefined;
  const config =
    typeof e === "object" && e !== null && "config" in e
      ? (e as { config?: { url?: string } }).config
      : undefined;
  return (
    response?.status === 403 &&
    normalizeUrl(config?.url) === "/auth/login"
  );
}
export async function pageGet<T>(
  url: string,
  page = 1,
  status = "",
): Promise<Page<T>> {
  const { data } = await api.get<
    | Page<T>
    | T[]
    | {
        items: T[];
        meta: { total: number; page: number; limit: number; pages: number };
      }
  >(url, {
    params: {
      page,
      limit: 10,
      ...(status && url !== "/contracts/my" ? { status } : {}),
    },
  });
  if (!Array.isArray(data) && "meta" in data)
    return {
      items: data.items,
      total: data.meta.total,
      page: data.meta.page,
      limit: data.meta.limit,
      totalPages: data.meta.pages,
    };
  return Array.isArray(data)
    ? { items: data, total: data.length, page, limit: 10 }
    : data;
}
