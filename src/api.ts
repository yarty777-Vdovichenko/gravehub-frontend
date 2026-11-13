import axios,{ AxiosError,InternalAxiosRequestConfig } from "axios";
export type Mode = "customer" | "employee";
export interface Profile {
  id: string;
  description?: string;
  name?: string;
  rating?: number;
  reviewsCount?: number;
  completedContracts?: number;
  user?: { name: string };
}
export interface User {
  id: string;
  email: string;
  name: string;
  roles: Mode[];
  mode: Mode;
  rolesComplete?: boolean;
  employeeProfile?: Profile;
}
export interface AuthResponse {
  accessToken: string;
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
let remembered: Session | null = null;
const unavailableRoles=new Set<Mode>();
export const canRequestRole=(role:Mode)=>!!remembered && !remembered.user.roles.includes(role) && (remembered.user.rolesComplete===true || unavailableRoles.has(role));
export function rememberIdentity(name:string,email:string){if(remembered){remembered={...remembered,user:{...remembered.user,name,email}};applySession(remembered)}}

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
  remembered = s;
  if(!s)unavailableRoles.clear();
  sessionListener(s);
}
export async function hydrateSession(response: AuthResponse): Promise<Session> {
  const part = response.accessToken.split(".")[1];
  if (!part) throw new Error("Некоректний access token");
  const payload: unknown = JSON.parse(
    atob(part.replace(/-/g, "+").replace(/_/g, "/")),
  );
  if (
    !payload ||
    typeof payload !== "object" ||
    !("sub" in payload) ||
    typeof payload.sub !== "string" ||
    !("role" in payload) ||
    (payload.role !== "customer" && payload.role !== "employee")
  )
    throw new Error("Некоректна сесія");
  // Claims guide the UI only; server guards enforce all access.
  return {
    accessToken: response.accessToken,
    user: {
      id: payload.sub,
      email: remembered?.user.id===payload.sub ? remembered.user.email : "",
      name: remembered?.user.id===payload.sub ? remembered.user.name : "Користувач",
      mode: payload.role,
      roles: Array.from(new Set<Mode>([...(remembered?.user.id===payload.sub?remembered.user.roles:[]),payload.role])),
      rolesComplete: remembered?.user.id===payload.sub ? remembered.user.rolesComplete : false,
    },
    mode: payload.role,
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
  return (
    /^\/(services|regions)(\?|$)/.test(url) ||
    /^\/auth\/(login|register|refresh)$/.test(url)
  );
}
api.interceptors.request.use((c) => {
  if (token && !publicPath(c.url)) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
api.interceptors.response.use(
  async (r) => {
    if (
      /^\/auth\/(login|register|switch-mode|roles\/(customer|employee))$/.test(
        r.config.url ?? "",
      )
    ) {
      const next=await hydrateSession(r.data as AuthResponse);
      if(r.config.url==='/auth/register'){const input=JSON.parse(String(r.config.data)) as RegisterInput;next.user.name=input.name;next.user.email=input.email;next.user.roles=[input.role];next.user.rolesComplete=true;}
      if(r.config.url?.startsWith('/auth/roles/')){const role=r.config.url.endsWith('/employee')?'employee':'customer';next.user.roles=Array.from(new Set([...next.user.roles,role]));}
      r.data=next;
    }
    return r;
  },
  async (e: AxiosError) => {
    if(e.response?.status===403 && e.config?.url==='/auth/switch-mode'){try{const input=JSON.parse(String(e.config.data)) as {mode:Mode};unavailableRoles.add(input.mode);sessionListener(remembered)}catch{/* No untrusted body propagation */}}

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
  if (axios.isAxiosError<ApiError>(e)) {
    const status = e.response?.status;
    if (status === 403) return "Ця дія недоступна у вашому поточному режимі.";
    if(status===401 && e.config?.url==="/auth/login") return "Невірний email/пароль";
    if (status === 401) return "Сесію завершено. Увійдіть знову.";
    const m = e.response?.data?.message;
    if (status === 404 && typeof m === 'string' && /^Cannot (GET|POST|DELETE) \/(cemeteries|plots)/.test(m))
      return 'Цей маршрут кладовищ або місць наразі недоступний на сервері. Решта розділів сайту може працювати; перевірте адресу API або зверніться до розробника бекенду.';
    if (m) return Array.isArray(m) ? m.join(" • ") : m;
    return "Не вдалося зв’язатися із сервером. Спробуйте ще раз.";
  }
  return e instanceof Error ? e.message : "Сталася помилка. Спробуйте ще раз.";
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
