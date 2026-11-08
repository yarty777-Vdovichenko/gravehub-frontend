import { Directory, LivePlots, AdvancedMarket } from "./NewPages";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Leaf,
  LayoutDashboard,
  ClipboardList,
  Flower2,
  MapPin,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Clock,
  Check,
  CheckCheck,
  LogOut,
  Briefcase,
  Star,
  X,
  Menu,
  UserRound,
  ShieldCheck,
  Mail,
  Heart,
  Send,
  LoaderCircle,
} from "lucide-react";
import {
  api,
  configured,
  listenSession,
  applySession,
  refresh,
  errorText,
  pageGet,
} from "./api";
import type {
  Session,
  Mode,
  Option,
  Contract,
  Proposal,
  Review,
  ContractInput,
  EmployeeInput,
  RegisterInput,
} from "./api";
import * as demoData from "./demo";
import "./style.css";
import { CemeteryMap } from "./CemeteryMap";
type Ctx = {
  session: Session | null;
  demo: boolean;
  mode: Mode;
  setDemo: () => void;
  switchMode: (m: Mode) => Promise<void>;
  logout: () => Promise<void>;
  contracts: Contract[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  services: Option[];
  regions: Option[];
  demoProposals: Proposal[];
  setDemoProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  notice: (s: string) => void;
};
const Context = createContext<Ctx>(null!);
const useApp = () => useContext(Context);
const demoUuid = () =>
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.floor(Math.random() * 16) >> (Number(c) / 4))).toString(
      16,
    ),
  );
const money = (n: number) => new Intl.NumberFormat("uk-UA").format(n) + " ₴";
const statuses: Record<string, string> = {
  open: "Відкрите",
  pending: "Очікує відповіді",
  in_progress: "У роботі",
  assigned: "У роботі",
  awaiting_confirmation: "Очікує підтвердження",
  pending_completion: "Очікує підтвердження",
  completed: "Завершено",
  accepted: "Прийнято",
  rejected: "Відхилено",
  cancelled: "Скасовано",
};
function Badge({ status }: { status: string }) {
  return (
    <span className={"badge " + status}>
      <i />
      {statuses[status] ?? status}
    </span>
  );
}
function Spinner() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Завантаження…
    </div>
  );
}
function App() {
  const [session, setSession] = useState<Session | null>(
      configured
        ? null
        : {
            accessToken: "",
            user: {
              id: "demo",
              name: "Андрій Коваль",
              email: "andrii@example.com",
              roles: ["customer", "employee"],
              mode: "customer",
            },
          },
    ),
    [demo, setDemoState] = useState(!configured),
    [boot, setBoot] = useState(configured),
    [contracts, setContracts] = useState(demoData.contracts),
    [services, setServices] = useState<Option[]>(
      configured ? [] : demoData.services,
    ),
    [regions, setRegions] = useState<Option[]>(
      configured ? [] : demoData.regions,
    ),
    [toast, setToast] = useState(""),
    [demoProposals, setDemoProposals] = useState<Proposal[]>([
      {
        id: "p1",
        price: 2200,
        comment: "Допоможу з озелененням. Підберу рослини та надішлю фотозвіт.",
        status: "pending",
        employee: {
          id: "demo",
          name: "Олександр Мельник",
          rating: 4.9,
          reviewsCount: 24,
        },
        contract: demoData.contracts[1],
      },
    ]);
  useEffect(
    () =>
      listenSession((s) => {
        setSession(s);
        if (!s && configured && !window.location.pathname.includes("login"))
          window.history.replaceState(null, "", "/login");
      }),
    [],
  );
  useEffect(() => {
    if (configured) {
      refresh()
        .catch(() => {})
        .finally(() => setBoot(false));
      api
        .get<Option[]>("/services")
        .then((r) => setServices(r.data))
        .catch(() => {});
      api
        .get<Option[]>("/regions")
        .then((r) => setRegions(r.data))
        .catch(() => {});
    }
  }, []);
  const notice = useCallback((s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 5000);
  }, []);
  const startDemo = () => {
    setDemoState(true);
    setServices(demoData.services);
    setRegions(demoData.regions);
    setSession({
      accessToken: "",
      user: {
        id: "demo",
        name: "Андрій Коваль",
        email: "andrii@example.com",
        roles: ["customer", "employee"],
        mode: "customer",
      },
    });
  };
  const switchMode = async (mode: Mode) => {
    if (demo) setSession((s) => (s ? { ...s, user: { ...s.user, mode } } : s));
    else {
      const r = await api.post<Session>("/auth/switch-mode", { mode });
      applySession(r.data);
    }
  };
  const logout = async () => {
    try {
      if (!demo) await api.post("/auth/logout");
      setDemoState(false);
      applySession(null);
      setSession(null);
    } catch (e) {
      notice(errorText(e));
    }
  };
  if (boot) return <Spinner />;
  return (
    <Context.Provider
      value={{
        session,
        demo,
        mode: session?.mode ?? session?.user.mode ?? "customer",
        setDemo: startDemo,
        switchMode,
        logout,
        contracts,
        setContracts,
        services,
        regions,
        demoProposals,
        setDemoProposals,
        notice,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route element={<Guard />}>
            <Route
              path="/"
              element={
                <Shell>
                  <Dashboard />
                </Shell>
              }
            />
            <Route
              path="/contracts"
              element={
                <Shell>
                  <ContractList />
                </Shell>
              }
            />
            <Route
              path="/contracts/new"
              element={
                <Guard mode="customer">
                  <Shell>
                    <NewContract />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <Shell>
                  <Details />
                </Shell>
              }
            />
            <Route
              path="/market"
              element={
                <Guard mode="employee">
                  <Shell>
                    <AdvancedMarket services={services} regions={regions} />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/proposals"
              element={
                <Guard mode="employee">
                  <Shell>
                    <Proposals />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/employees"
              element={
                <Shell>
                  <Directory services={services} regions={regions} />
                </Shell>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <Shell>
                  <Directory services={services} regions={regions} />
                </Shell>
              }
            />
            <Route
              path="/plots"
              element={
                <Guard mode="customer">
                  <Shell>
                    <LivePlots />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/map"
              element={
                <Shell>
                  <MapPage />
                </Shell>
              }
            />
            <Route
              path="/services"
              element={
                <Shell>
                  <Services />
                </Shell>
              }
            />
            <Route
              path="/profile"
              element={
                <Shell>
                  <Profile />
                </Shell>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {toast && (
          <div role="status" className="toast">
            <Check size={18} />
            {toast}
            <button onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </div>
        )}
      </BrowserRouter>
    </Context.Provider>
  );
}
import { Outlet } from "react-router-dom";
function Guard({
  children,
  mode,
}: {
  children?: React.ReactNode;
  mode?: Mode;
}) {
  const a = useApp();
  if (!a.session) return <Navigate to="/login" replace />;
  if (mode && a.mode !== mode) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}
function Shell({ children }: { children: React.ReactNode }) {
  const a = useApp(),
    [mobile, setMobile] = useState(false),
    nav = useNavigate();
  const links = [
    { to: "/", icon: LayoutDashboard, text: "Огляд" },
    {
      to: "/contracts",
      icon: ClipboardList,
      text: a.mode === "customer" ? "Мої замовлення" : "Моя робота",
    },
    ...(a.mode === "employee"
      ? [
          { to: "/market", icon: Search, text: "Знайти замовлення" },
          { to: "/proposals", icon: Send, text: "Мої пропозиції" },
        ]
      : []),
    { to: "/map", icon: MapPin, text: "Карта кладовища" },
    { to: "/employees", icon: Search, text: "Знайти виконавця" },
    ...(a.mode === "customer"
      ? [{ to: "/plots", icon: MapPin, text: "Мої місця" }]
      : []),
    { to: "/services", icon: Flower2, text: "Послуги" },
    { to: "/profile", icon: UserRound, text: "Мій профіль" },
  ];
  return (
    <div className="app">
      <aside className={mobile ? "sidebar visible" : "sidebar"}>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Leaf />
          </span>
          Grave<span>Hub</span>
          <i />
        </Link>
        <div className="workspace-label">ОСОБИСТИЙ КАБІНЕТ</div>
        <div className="mode-switch">
          <button
            className={a.mode === "customer" ? "selected" : ""}
            onClick={() => {
              if (a.demo && !a.session?.user.roles.includes("customer"))
                nav("/profile");
              else
                a.switchMode("customer")
                  .then(() => nav("/"))
                  .catch((e) => a.notice(errorText(e)));
            }}
          >
            Замовник
          </button>
          <button
            className={a.mode === "employee" ? "selected" : ""}
            onClick={() => {
              if (a.demo && !a.session?.user.roles.includes("employee"))
                nav("/profile");
              else
                a.switchMode("employee")
                  .then(() => nav("/"))
                  .catch((e) => a.notice(errorText(e)));
            }}
          >
            Виконавець
          </button>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink
              end={l.to === "/"}
              key={l.to}
              to={l.to}
              onClick={() => setMobile(false)}
            >
              <l.icon size={19} />
              {l.text}
              {l.to === "/contracts" && a.demo && (
                <span className="nav-count">3</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support">
            <div className="support-icon">
              <Heart size={20} />
            </div>
            <b>Ми поруч, щоб допомогти</b>
            <p>
              Усе про роботу платформи
              <br />
              та ваші наступні кроки.
            </p>
            <Link to="/services">
              Переглянути послуги <ArrowUpRight size={15} />
            </Link>
          </div>
          <button className="user" onClick={() => nav("/profile")}>
            <span className="avatar">
              {a.session?.user.name?.slice(0, 1) ?? "К"}
            </span>
            <span>
              <b>{a.session?.user.name}</b>
              <small>
                {a.mode === "customer"
                  ? "Особистий кабінет"
                  : "Кабінет виконавця"}
              </small>
            </span>
            <ChevronRight size={17} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header>
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Особистий кабінет <ChevronRight size={13} />{" "}
            <span>
              {links.find((l) => l.to === window.location.pathname)?.text ??
                "Замовлення"}
            </span>
          </div>
          <div className="header-right">
            <span className="secure">
              <ShieldCheck size={15} /> Простір довіри
            </span>
            <span className="header-divider" />
            <button
              className="icon-button"
              title="Вийти"
              onClick={() => a.logout()}
            >
              <LogOut size={18} />
            </button>
            <span className="avatar small">
              {a.session?.user.name?.slice(0, 1)}
            </span>
          </div>
        </header>
        {a.demo && (
          <div className="demo-banner">
            <span>
              <i />
              Демонстраційний режим — зміни зберігаються до оновлення сторінки
            </span>
            <Link to="/login">
              Підключити обліковий запис <ArrowUpRight size={13} />
            </Link>
          </div>
        )}
        <main>{children}</main>
        <footer>
          <span>© 2026 GraveHub. З турботою про пам’ять.</span>
          <span>
            <Leaf size={13} /> Пам’ять об’єднує
          </span>
        </footer>
      </div>
    </div>
  );
}
function useList(url: string, status = "", demoItems?: Contract[]) {
  const a = useApp(),
    [items, setItems] = useState<Contract[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    if (a.demo) {
      const all = (demoItems ?? a.contracts).filter(
        (c) => !status || c.status === status,
      );
      setItems(all.slice((page - 1) * 10, page * 10));
      setTotal(all.length);
      setLoading(false);
    } else
      pageGet<Contract>(url, page, status)
        .then((r) => {
          if (live) {
            setItems(r.items);
            setTotal(r.total);
          }
        })
        .catch((e) => {
          if (live) setError(errorText(e));
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    return () => {
      live = false;
    };
  }, [url, page, status, a.demo, a.contracts, tick]);
  return {
    items,
    page,
    setPage,
    total,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}
function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function CreateButton() {
  return (
    <Link className="button primary" to="/contracts/new">
      <Plus size={18} /> Створити замовлення
    </Link>
  );
}
function Dashboard() {
  const a = useApp(),
    list = useList(
      a.mode === "customer" ? "/contracts/my" : "/employee/my-contracts",
    ),
    [filter, setFilter] = useState("all");
  const active = list.items.filter((c) =>
    ["in_progress", "assigned"].includes(c.status),
  ).length;
  return (
    <>
      <PageTitle
        title={`Вітаємо, ${a.session?.user.name?.split(" ")[0] ?? "друже"} 👋`}
        subtitle="Турбота про пам’ять починається з простих кроків."
        action={
          a.mode === "customer" ? (
            <CreateButton />
          ) : (
            <Link to="/market" className="button primary">
              <Search size={17} /> Знайти замовлення
            </Link>
          )
        }
      />
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <span /> ТУРБОТА, ЩО МАЄ ЗНАЧЕННЯ
          </span>
          <h2>
            Бережемо пам’ять.
            <br />
            Піклуємося разом.
          </h2>
          <p>
            Довірте догляд перевіреним людям.
            <br />
            Ми допоможемо бути поруч, навіть на відстані.
          </p>
          <Link to="/services">
            Обрати послугу <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-art">
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill" />
          <div className="plant p1" />
          <div className="plant p2" />
          <div className="plant p3" />
          <span className="art-note">
            <Leaf size={17} /> З повагою до кожної історії
          </span>
        </div>
      </section>
      <Link className="map-dashboard-link" to="/map">
        <div>
          <h2>Знайдіть місце на карті</h2>
          <p>
            Інтерактивний план кладовища · вибір ділянки · навчальна
            демонстрація
          </p>
        </div>
        <MapPin size={26} />
      </Link>
      <section className="stats">
        <Stat
          label="Усього замовлень"
          value={list.total}
          icon={<ClipboardList />}
          caption="Усі ваші замовлення"
        />
        <Stat
          label="У роботі"
          value={active}
          icon={<Clock />}
          caption={a.demo ? "Турбота вже триває" : "На поточній сторінці"}
        />
        <Stat
          label="Очікують на рішення"
          value={list.items.filter((c) => c.status === "open").length}
          icon={<Mail />}
          caption={a.demo ? "Перегляньте пропозиції" : "На поточній сторінці"}
        />
        <Stat
          label="Завершено"
          value={list.items.filter((c) => c.status === "completed").length}
          icon={<CheckCheck />}
          caption={
            a.demo ? "Збережені моменти турботи" : "На поточній сторінці"
          }
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel orders">
          <div className="panel-title">
            <h2>
              Мої замовлення <span>{list.total}</span>
            </h2>
            <Link to="/contracts">
              Усі замовлення <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="tabs">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              Усі замовлення
            </button>
            <button
              className={filter === "active" ? "active" : ""}
              onClick={() => setFilter("active")}
            >
              Активні
            </button>
            <button
              className={filter === "completed" ? "active" : ""}
              onClick={() => setFilter("completed")}
            >
              Завершені
            </button>
          </div>
          {list.loading ? (
            <Spinner />
          ) : list.error ? (
            <ErrorBox text={list.error} retry={list.reload} />
          ) : (
            <>
              {list.items
                .filter(
                  (c) =>
                    filter === "all" ||
                    (filter === "completed"
                      ? c.status === "completed"
                      : c.status !== "completed"),
                )
                .slice(0, 3)
                .map((c) => (
                  <OrderRow key={c.id} c={c} />
                ))}
              {list.items.length === 0 && <Empty />}
            </>
          )}
          <div className="panel-foot">
            <ShieldCheck size={14} /> Ваші замовлення та особисті дані захищені
          </div>
        </section>
        <section className="panel steps">
          <span className="tiny-icon">
            <Flower2 size={19} />
          </span>
          <h2>Турбота — це просто</h2>
          <p>Від першого кроку до результату</p>
          {[
            ["Створіть замовлення", "Опишіть, яка допомога потрібна."],
            ["Оберіть виконавця", "Перегляньте пропозиції та відгуки."],
            ["Прийміть результат", "Підтвердьте виконання й залиште відгук."],
          ].map(([t, d], i) => (
            <div className="step" key={t}>
              <span>{i + 1}</span>
              <div>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            </div>
          ))}
          <Link to="/services">
            Дізнатись про послуги <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <h2>Як ми можемо допомогти</h2>
          <p>Дбайливий догляд у кожній деталі</p>
        </div>
        <Link to="/services">
          Усі послуги <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="service-grid">
        {a.services.slice(0, 4).map((s, i) => (
          <ServiceCard key={s.id} s={s} i={i} />
        ))}
      </div>
    </>
  );
}
function Stat({
  label,
  value,
  icon,
  caption,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  caption: string;
}) {
  return (
    <div className="stat">
      <div>
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <small>{caption}</small>
    </div>
  );
}
function OrderRow({ c }: { c: Contract }) {
  const a = useApp();
  return (
    <Link className="order-row" to={"/contracts/" + c.id}>
      <div className={"order-icon " + c.status}>
        <Flower2 size={23} />
      </div>
      <div className="order-info">
        <div>
          <h3>{c.title}</h3>
          <Badge status={c.status} />
        </div>
        <p>
          <MapPin size={12} />
          {c.region?.name ??
            a.regions.find((r) => r.id === c.regionId)?.name ??
            "Регіон замовлення"}
          <span>·</span>
          {new Date(c.date).toLocaleDateString("uk-UA")}
        </p>
        <div className="order-bottom">
          <span>
            {c.employee?.name ??
              c.employee?.user?.name ??
              (c.status === "completed"
                ? "Роботу виконано"
                : "Очікує на виконавця")}
          </span>
          {c.status === "open" && (
            <b>{c.proposalsCount ?? c._count?.proposals ?? 0} пропозицій</b>
          )}
        </div>
      </div>
      <div className="order-price">
        <b>{money(c.budget)}</b>
        <ArrowUpRight size={16} />
      </div>
    </Link>
  );
}
const descriptions = [
  "Чистота й охайність місця пам’яті",
  "Живі квіти та доглянута зелень",
  "Дбайливе відновлення пам’ятників",
  "Знак вашої любові та пам’яті",
];
function ServiceCard({ s, i }: { s: Option; i: number }) {
  const a = useApp();
  return (
    <Link
      to={a.mode === "customer" ? "/contracts/new?service=" + s.id : "/market"}
      className={"service-card service-" + i}
    >
      <div>
        {i % 2 ? <Flower2 /> : <Leaf />}
        <ArrowUpRight size={17} />
      </div>
      <h3>{s.name}</h3>
      <p>{s.description ?? descriptions[i % 4]}</p>
    </Link>
  );
}
function Empty({ text = "Поки що тут немає замовлень" }: { text?: string }) {
  return (
    <div className="empty">
      <Flower2 size={30} />
      <h3>{text}</h3>
      <p>Нові записи з’являться тут після створення.</p>
    </div>
  );
}
function ErrorBox({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <div role="alert" className="error">
      {text}
      {retry && <button onClick={retry}>Спробувати знову</button>}
    </div>
  );
}
function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <span>Знайдено: {total}</span>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      <span>
        Сторінка {page} з {Math.max(1, Math.ceil(total / 10))}
      </span>
      <button disabled={page * 10 >= total} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
function ContractList({ market = false }: { market?: boolean }) {
  const a = useApp(),
    [status, setStatus] = useState(""),
    [q, setQ] = useState(""),
    list = useList(
      market
        ? "/employee/contracts"
        : a.mode === "customer"
          ? "/contracts/my"
          : "/employee/my-contracts",
      status,
      market ? a.contracts.filter((c) => c.status === "open") : undefined,
    );
  return (
    <>
      <PageTitle
        title={
          market
            ? "Знайти замовлення"
            : a.mode === "customer"
              ? "Мої замовлення"
              : "Моя робота"
        }
        subtitle={
          market
            ? "Відкриті замовлення у ваших регіонах."
            : "Усі деталі та наступні кроки — в одному місці."
        }
        action={a.mode === "customer" ? <CreateButton /> : undefined}
      />
      <section className="panel">
        <div className="filters">
          <label className="search">
            <Search size={17} />
            <input
              placeholder="Пошук на поточній сторінці"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          {!market && (
            <label className="status-filter">
              <SlidersHorizontal size={16} />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  list.setPage(1);
                }}
              >
                <option value="">Усі статуси</option>
                {[
                  "open",
                  "in_progress",
                  "awaiting_confirmation",
                  "completed",
                ].map((s) => (
                  <option key={s} value={s}>
                    {statuses[s]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {list.loading ? (
          <Spinner />
        ) : list.error ? (
          <ErrorBox text={list.error} retry={list.reload} />
        ) : list.items.filter((c) =>
            c.title.toLowerCase().includes(q.toLowerCase()),
          ).length ? (
          list.items
            .filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
            .map((c) => <OrderRow key={c.id} c={c} />)
        ) : (
          <Empty />
        )}
        <Pagination
          page={list.page}
          total={list.total}
          onChange={list.setPage}
        />
      </section>
    </>
  );
}
interface PlotSelection {
  id: string;
  number: string;
  cemetery: string;
  regionName: string;
  positionX: number;
  positionY: number;
}
function readPlotSelection(state: unknown): PlotSelection | null {
  if (!state || typeof state !== "object" || !("plotSelection" in state))
    return null;
  const p = state.plotSelection;
  if (!p || typeof p !== "object") return null;
  if (
    !("id" in p) ||
    typeof p.id !== "string" ||
    !("number" in p) ||
    typeof p.number !== "string" ||
    !("cemetery" in p) ||
    typeof p.cemetery !== "string" ||
    !("regionName" in p) ||
    typeof p.regionName !== "string" ||
    !("positionX" in p) ||
    typeof p.positionX !== "number" ||
    !Number.isFinite(p.positionX) ||
    !("positionY" in p) ||
    typeof p.positionY !== "number" ||
    !Number.isFinite(p.positionY)
  )
    return null;
  return {
    id: p.id,
    number: p.number,
    cemetery: p.cemetery,
    regionName: p.regionName,
    positionX: p.positionX,
    positionY: p.positionY,
  };
}
function MapPage() {
  const a = useApp();
  return a.demo ? (
    <CemeteryMap demo={a.demo} customer={a.mode === "customer"} />
  ) : a.mode === "customer" ? (
    <LivePlots />
  ) : (
    <p>Карта місць доступна в режимі замовника.</p>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function NewContract() {
  const a = useApp(),
    location = useLocation(),
    nav = useNavigate(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const selection = a.demo ? readPlotSelection(location.state) : null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const date = new Date(String(f.get("date")));
    if (date.getTime() <= Date.now()) {
      setError("Оберіть дату та час у майбутньому.");
      return;
    }
    const body: ContractInput = {
      title: String(f.get("title")).trim(),
      description: String(f.get("description")).trim(),
      serviceTypeId: String(f.get("serviceTypeId")),
      regionId: String(f.get("regionId")),
      positionX: Number(f.get("positionX")),
      positionY: Number(f.get("positionY")),
      date: date.toISOString(),
      budget: Number(f.get("budget")),
    };
    setBusy(true);
    try {
      if (a.demo) {
        const c: Contract = {
          ...body,
          id: demoUuid(),
          status: "open",
          region: a.regions.find((r) => r.id === body.regionId),
          serviceType: a.services.find((s) => s.id === body.serviceTypeId),
          proposalsCount: 0,
        };
        a.setContracts((cs) => [c, ...cs]);
        nav("/contracts/" + c.id);
      } else {
        const r = await api.post<Contract>("/contracts", body);
        nav("/contracts/" + r.data.id);
      }
      a.notice("Замовлення створено");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to="/contracts">
        <ChevronLeft size={16} /> До замовлень
      </Link>
      <PageTitle
        title="Нове замовлення"
        subtitle="Розкажіть, яка турбота потрібна. Виконавці запропонують свою допомогу."
      />
      <form className="panel form-panel" onSubmit={submit}>
        <h2>Деталі замовлення</h2>
        {selection ? (
          <div className="plot-selection-banner">
            <MapPin size={19} />
            <div>
              <b>
                {selection.cemetery} · ділянка {selection.number}
              </b>
              <p>Демонстраційне місце. Замовлення догляду не бронює ділянку.</p>
              <Link to="/map">Змінити місце на карті</Link>
            </div>
          </div>
        ) : (
          <Link className="back" to="/map">
            <MapPin size={15} /> Обрати місце на карті
          </Link>
        )}
        <Field label="Назва замовлення">
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Наприклад, сезонний догляд за могилою"
          />
        </Field>
        <Field label="Опис роботи">
          <textarea
            name="description"
            maxLength={2000}
            defaultValue={
              selection
                ? `Догляд за ділянкою ${selection.number}, ${selection.cemetery}.\nПобажання: `
                : undefined
            }
            required
            rows={4}
            placeholder="Опишіть обсяг роботи, особливості та ваші побажання"
          />
        </Field>
        <div className="form-grid">
          <Field label="Послуга">
            <select
              required
              name="serviceTypeId"
              defaultValue={
                new URLSearchParams(window.location.search).get("service") ?? ""
              }
            >
              <option value="" disabled>
                Оберіть послугу
              </option>
              {a.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Регіон">
            <select
              required
              name="regionId"
              defaultValue={
                selection
                  ? (a.regions.find((r) => r.name === selection.regionName)
                      ?.id ?? "")
                  : ""
              }
            >
              <option value="" disabled>
                Оберіть регіон
              </option>
              {a.regions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Координата X">
            <input
              name="positionX"
              defaultValue={selection?.positionX}
              type="number"
              min="0"
              step="any"
              required
              placeholder="49.8397"
            />
          </Field>
          <Field label="Координата Y">
            <input
              name="positionY"
              defaultValue={selection?.positionY}
              type="number"
              min="0"
              step="any"
              required
              placeholder="24.0297"
            />
          </Field>
          <Field label="Дата та час виконання">
            <input
              name="date"
              type="datetime-local"
              required
              min={new Date(Date.now() + 60000)
                .toLocaleString("sv-SE")
                .slice(0, 16)
                .replace(" ", "T")}
            />
          </Field>
          <Field label="Бюджет, ₴">
            <input
              name="budget"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="1200"
            />
          </Field>
        </div>
        {error && <ErrorBox text={error} />}
        <div className="form-actions">
          <Link className="button secondary" to="/contracts">
            Скасувати
          </Link>
          <button className="button primary" disabled={busy}>
            {busy ? "Створення…" : "Опублікувати замовлення"}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </>
  );
}
function Details() {
  const { id } = useParams(),
    a = useApp(),
    nav = useNavigate(),
    [c, setC] = useState<Contract>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [proposals, setProposals] = useState<Proposal[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [reviewFor, setReviewFor] = useState<string>(),
    [reviews, setReviews] = useState<Review[]>([]),
    [reviewPage, setReviewPage] = useState(1),
    [reviewTotal, setReviewTotal] = useState(0),
    [confirmDelete, setConfirmDelete] = useState(false);
  const load = useCallback(async () => {
    try {
      if (a.demo) {
        setC(a.contracts.find((x) => x.id === id));
        setProposals(
          a.demoProposals
            .filter((p) => p.contract?.id === id)
            .slice((page - 1) * 10, page * 10),
        );
        setTotal(a.demoProposals.filter((p) => p.contract?.id === id).length);
      } else {
        const r = await api.get<Contract>(
          (a.mode === "customer" ? "/contracts/" : "/employee/contracts/") + id,
        );
        setC(r.data);
        if (a.mode === "customer") {
          const p = await pageGet<Proposal>(
            "/contracts/" + id + "/proposals",
            page,
          );
          setProposals(p.items);
          setTotal(p.total);
        }
      }
    } catch (e) {
      setError(errorText(e));
    }
  }, [id, a.demo, a.contracts, a.mode, page, a.demoProposals]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!reviewFor) return;
    if (a.demo) {
      setReviews([
        {
          id: "r1",
          rating: 5,
          text: "Дякую за акуратну роботу та уважність до деталей.",
          customer: { name: "Марія" },
        },
      ]);
      setReviewTotal(1);
    } else
      pageGet<Review>("/employees/" + reviewFor + "/reviews", reviewPage)
        .then((r) => {
          setReviews(r.items);
          setReviewTotal(r.total);
        })
        .catch((e) => a.notice(errorText(e)));
  }, [reviewFor, reviewPage, a.demo]);
  async function action(
    path: string,
    body?: object,
    demoStatus?: string,
    method: "post" | "delete" = "post",
  ) {
    setBusy(true);
    try {
      if (a.demo) {
        if (
          path.startsWith("/employee/contracts/") &&
          path.endsWith("/proposals") &&
          body &&
          "price" in body
        ) {
          a.setDemoProposals((ps) => [
            ...ps,
            {
              id: demoUuid(),
              price: Number(body.price),
              comment: String("comment" in body ? body.comment : ""),
              status: "pending",
              contract: c,
              employee: {
                id: "demo",
                name: a.session?.user.name,
                reviewsCount: 0,
              },
            },
          ]);
        } else if (method === "delete") {
          a.setContracts((cs) => cs.filter((x) => x.id !== id));
          nav("/contracts");
        } else if (demoStatus)
          a.setContracts((cs) =>
            cs.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: demoStatus,
                    ...(body && "rating" in body
                      ? {
                          review: {
                            id: demoUuid(),
                            rating: Number(body.rating),
                            text: String("text" in body ? body.text : ""),
                          },
                        }
                      : {}),
                  }
                : x,
            ),
          );
        else
          a.setDemoProposals((ps) =>
            ps.map((p) =>
              path.includes(p.id)
                ? {
                    ...p,
                    status: path.endsWith("accept") ? "accepted" : "rejected",
                  }
                : p,
            ),
          );
      } else {
        await api[method](path, body);
        if (method === "delete") nav("/contracts");
        else await load();
      }
      a.notice("Зміни збережено");
    } catch (e) {
      a.notice(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorBox text={error} retry={load} />;
  if (!c) return <Spinner />;
  const own = a.mode === "customer";
  return (
    <>
      <Link className="back" to={own ? "/contracts" : "/market"}>
        <ChevronLeft size={16} /> До списку
      </Link>
      <PageTitle
        title={c.title}
        subtitle={"Замовлення · " + c.id.slice(0, 8)}
      />
      <div className="detail-grid">
        <div>
          <section className="panel detail-panel">
            <div className="detail-top">
              <Badge status={c.status} />
              <strong>{money(c.budget)}</strong>
            </div>
            <h2>Опис замовлення</h2>
            <p className="description">{c.description}</p>
            <div className="detail-meta">
              <span>
                <Flower2 size={18} />
                {c.serviceType?.name ??
                  a.services.find((s) => s.id === c.serviceTypeId)?.name ??
                  "Послуга"}
              </span>
              <span>
                <MapPin size={18} />
                {c.region?.name ??
                  a.regions.find((s) => s.id === c.regionId)?.name}
              </span>
              <span>
                <Clock size={18} />
                {new Date(c.date).toLocaleString("uk-UA")}
              </span>
              <span>
                Координати: {c.positionX}, {c.positionY}
              </span>
            </div>
            {c.review && (
              <div className="review">
                <b>{"★".repeat(c.review.rating)} · Ваш відгук</b>
                <p>{c.review.text}</p>
              </div>
            )}
            {own && c.status === "open" && !c.employeeId && !c.employee && (
              <div className="delete-area">
                {confirmDelete ? (
                  <>
                    <span>Видалити це замовлення?</span>
                    <button
                      disabled={busy}
                      className="danger"
                      onClick={() =>
                        action(
                          "/contracts/" + id,
                          undefined,
                          undefined,
                          "delete",
                        )
                      }
                    >
                      Так, видалити
                    </button>
                    <button onClick={() => setConfirmDelete(false)}>
                      Залишити
                    </button>
                  </>
                ) : (
                  <button
                    className="danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Видалити замовлення
                  </button>
                )}
              </div>
            )}
          </section>
          {own && (
            <section className="panel detail-panel">
              <h2>Пропозиції виконавців</h2>
              {proposals.length === 0 ? (
                <Empty text="Пропозицій поки немає" />
              ) : (
                proposals.map((p) => {
                  const e = p.employeeProfile ?? p.employee;
                  return (
                    <div className="proposal" key={p.id}>
                      <div className="proposal-head">
                        <span className="avatar">
                          {e?.name?.slice(0, 1) ?? "В"}
                        </span>
                        <div>
                          <b>{e?.name ?? e?.user?.name ?? "Виконавець"}</b>
                          <button
                            className="text-button"
                            onClick={() => {
                              if (e) {
                                setReviewPage(1);
                                setReviewFor(e.id);
                              }
                            }}
                          >
                            {!e?.reviewsCount
                              ? "Без відгуків"
                              : `★ ${e.rating ?? "—"} · ${e.reviewsCount} відгуків`}
                          </button>
                        </div>
                        <strong>{money(p.price)}</strong>
                      </div>
                      <p>{p.comment}</p>
                      <Badge status={p.status} />
                      {p.status === "pending" && c.status === "open" && (
                        <div className="form-actions">
                          <button
                            disabled={busy}
                            className="button secondary"
                            onClick={() =>
                              action(
                                `/contracts/${id}/proposals/${p.id}/reject`,
                              )
                            }
                          >
                            Відхилити
                          </button>
                          <button
                            disabled={busy}
                            className="button primary"
                            onClick={() =>
                              action(
                                `/contracts/${id}/proposals/${p.id}/accept`,
                                undefined,
                                "in_progress",
                              )
                            }
                          >
                            Прийняти
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <Pagination page={page} total={total} onChange={setPage} />
            </section>
          )}
        </div>
        <section className="panel detail-panel next-step">
          <h2>Наступний крок</h2>
          {own ? (
            ["awaiting_confirmation", "pending_completion"].includes(
              c.status,
            ) ? (
              <>
                <p>Перевірте результат та оцініть роботу виконавця.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action(
                      `/customer/contracts/${id}/confirm`,
                      {
                        rating: Number(f.get("rating")),
                        text: String(f.get("text")),
                      },
                      "completed",
                    );
                  }}
                >
                  <Field label="Оцінка">
                    <select name="rating">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Відгук">
                    <textarea name="text" required rows={4} maxLength={1000} />
                  </Field>
                  <button disabled={busy} className="button primary">
                    Підтвердити виконання
                  </button>
                </form>
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() =>
                    action(
                      `/customer/contracts/${id}/reject-completion`,
                      undefined,
                      "in_progress",
                    )
                  }
                >
                  На доопрацювання
                </button>
              </>
            ) : (
              <>
                <ShieldCheck className="large-icon" />
                <p>
                  {c.status === "completed"
                    ? "Дякуємо, що довіряєте турботу GraveHub."
                    : c.status === "open"
                      ? "Перегляньте пропозиції та оберіть виконавця."
                      : "Виконавець працює над вашим замовленням. Тут ви зможете підтвердити результат."}
                </p>
              </>
            )
          ) : c.status === "open" ? (
            <>
              <p>Запропонуйте свою ціну та розкажіть, як допоможете.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  action(`/employee/contracts/${id}/proposals`, {
                    price: Number(f.get("price")),
                    comment: String(f.get("comment")),
                  });
                }}
              >
                <Field label="Ваша ціна, ₴">
                  <input required type="number" name="price" min={1} step="1" />
                </Field>
                <Field label="Коментар">
                  <textarea name="comment" required maxLength={1000} rows={4} />
                </Field>
                <button className="button primary" disabled={busy}>
                  Надіслати пропозицію
                </button>
              </form>
            </>
          ) : ["in_progress", "assigned"].includes(c.status) ? (
            <>
              <p>
                Завершили всю роботу? Надішліть її замовнику на підтвердження.
              </p>
              <button
                disabled={busy}
                className="button primary"
                onClick={() =>
                  action(
                    `/employee/my-contracts/${id}/complete`,
                    undefined,
                    "awaiting_confirmation",
                  )
                }
              >
                Роботу виконано
              </button>
            </>
          ) : (
            <p>Поточний статус: {statuses[c.status] ?? c.status}</p>
          )}
        </section>
      </div>
      {reviewFor && (
        <div className="modal-backdrop">
          <section className="panel modal">
            <button className="close" onClick={() => setReviewFor(undefined)}>
              <X />
            </button>
            <h2>Відгуки про виконавця</h2>
            {reviews.length ? (
              reviews.map((r) => (
                <div className="review" key={r.id}>
                  <b>
                    {"★".repeat(r.rating)} {r.customer?.name}
                  </b>
                  <p>{r.text}</p>
                </div>
              ))
            ) : (
              <Empty text="Без відгуків" />
            )}
            <Pagination
              page={reviewPage}
              total={reviewTotal}
              onChange={setReviewPage}
            />
          </section>
        </div>
      )}
    </>
  );
}
function Proposals() {
  const a = useApp(),
    [items, setItems] = useState<Proposal[]>([]),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setLoading(true);
    if (a.demo) {
      const ps = a.demoProposals.filter((p) => !status || p.status === status);
      setItems(ps.slice((page - 1) * 10, page * 10));
      setTotal(ps.length);
      setLoading(false);
    } else
      pageGet<Proposal>("/employee/proposals", page, status)
        .then((r) => {
          setItems(r.items);
          setTotal(r.total);
        })
        .catch((e) => setError(errorText(e)))
        .finally(() => setLoading(false));
  }, [a.demo, page, status, tick, a.demoProposals]);
  return (
    <>
      <PageTitle
        title="Мої пропозиції"
        subtitle="Стежте за відповідями замовників та керуйте своїми пропозиціями."
      />
      <section className="panel detail-panel">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Усі статуси</option>
          {["pending", "accepted", "rejected"].map((s) => (
            <option key={s} value={s}>
              {statuses[s]}
            </option>
          ))}
        </select>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorBox text={error} retry={() => setTick((t) => t + 1)} />
        ) : items.length ? (
          items.map((p) => (
            <div className="proposal" key={p.id}>
              <Link to={"/contracts/" + p.contract?.id}>
                <h3>{p.contract?.title ?? "Замовлення"}</h3>
              </Link>
              <Badge status={p.status} />
              <p>{p.comment}</p>
              <b>{money(p.price)}</b>
              {p.status === "pending" && (
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      if (a.demo)
                        a.setDemoProposals((ps) =>
                          ps.filter((x) => x.id !== p.id),
                        );
                      else await api.delete("/employee/proposals/" + p.id);
                      setTick((t) => t + 1);
                      a.notice("Пропозицію скасовано");
                    } catch (e) {
                      a.notice(errorText(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Скасувати пропозицію
                </button>
              )}
            </div>
          ))
        ) : (
          <Empty text="Ви ще не надсилали пропозицій" />
        )}
        <Pagination page={page} total={total} onChange={setPage} />
      </section>
    </>
  );
}
function Services() {
  const a = useApp();
  return (
    <>
      <PageTitle
        title="Послуги з турботою"
        subtitle="Оберіть допомогу, яка потрібна вашому місцю пам’яті."
      />
      <div className="service-grid full">
        {a.services.map((s, i) => (
          <ServiceCard s={s} i={i} key={s.id} />
        ))}
      </div>
      {a.services.length === 0 && <Empty text="Послуги наразі недоступні" />}
      <section className="panel detail-panel">
        <h2>Як це працює</h2>
        <p className="description">
          Оберіть послугу, вкажіть регіон, координати місця, дату виконання та
          бюджет. Виконавці у вашому регіоні зможуть надіслати пропозиції.
          Перегляньте їхній досвід і відгуки, оберіть виконавця та підтвердьте
          результат після завершення роботи.
        </p>
      </section>
    </>
  );
}
function EmployeeFields({
  services,
  regions,
}: {
  services: Option[];
  regions: Option[];
}) {
  return (
    <>
      <Field label="Про ваш досвід">
        <textarea
          name="description"
          required
          minLength={6}
          maxLength={1000}
          rows={3}
        />
      </Field>
      <fieldset>
        <legend>Спеціалізації</legend>
        {services.map((s) => (
          <label className="checkbox" key={s.id}>
            <input type="checkbox" name="specializationIds" value={s.id} />
            {s.name}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Регіони роботи</legend>
        {regions.map((s) => (
          <label className="checkbox" key={s.id}>
            <input type="checkbox" name="regionIds" value={s.id} />
            {s.name}
          </label>
        ))}
      </fieldset>
    </>
  );
}
const employeeInput = (f: FormData): EmployeeInput => ({
  description: String(f.get("description")),
  specializationIds: f.getAll("specializationIds").map(String),
  regionIds: f.getAll("regionIds").map(String),
});
function Profile() {
  const a = useApp(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageTitle
        title="Мій профіль"
        subtitle="Ваш обліковий запис та можливості на платформі."
      />
      <section className="panel form-panel">
        <div className="profile-head">
          <span className="avatar big">
            {a.session?.user.name?.slice(0, 1)}
          </span>
          <div>
            <h2>{a.session?.user.name}</h2>
            <p>{a.session?.user.email}</p>
          </div>
        </div>
        <h3>Ваші ролі</h3>
        <div className="role-list">
          {a.session?.user.roles.map((r) => (
            <span className="badge completed" key={r}>
              <Check size={13} />
              {r === "customer" ? "Замовник" : "Виконавець"}
            </span>
          ))}
        </div>
        {!a.session?.user.roles.includes("employee") && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const body = employeeInput(new FormData(e.currentTarget));
              if (!body.regionIds.length || !body.specializationIds.length) {
                setError("Оберіть хоча б один регіон і спеціалізацію.");
                return;
              }
              setBusy(true);
              try {
                await api.post("/auth/roles/employee", body);
                await refresh();
                a.notice("Роль виконавця додано");
              } catch (e) {
                setError(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>Стати виконавцем</h3>
            <EmployeeFields services={a.services} regions={a.regions} />
            {error && <ErrorBox text={error} />}
            <button className="button primary" disabled={busy}>
              Додати роль виконавця
            </button>
          </form>
        )}
        {!a.session?.user.roles.includes("customer") && (
          <button
            disabled={busy}
            className="button primary"
            onClick={async () => {
              setBusy(true);
              try {
                await api.post("/auth/roles/customer");
                await refresh();
                a.notice("Роль замовника додано");
              } catch (e) {
                a.notice(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Додати роль замовника
          </button>
        )}
        <button className="button secondary logout" onClick={() => a.logout()}>
          <LogOut size={16} /> Вийти з облікового запису
        </button>
      </section>
    </>
  );
}
function Auth({ register = false }: { register?: boolean }) {
  const a = useApp(),
    nav = useNavigate(),
    [role, setRole] = useState<Mode>("customer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const location = useLocation();
  useEffect(() => {
    setError("");
  }, [location.pathname]);
  if (a.session && configured && !a.demo) return <Navigate to="/" replace />;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured) {
      setError(
        "Для входу потрібне підключення API. Наразі ви можете переглянути демонстрацію.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      let body: RegisterInput | { email: string; password: string } = {
        email: String(f.get("email")),
        password: String(f.get("password")),
      };
      if (register) {
        body = {
          ...body,
          name: String(f.get("name")),
          role,
          ...(role === "employee" ? { employeeProfile: employeeInput(f) } : {}),
        };
        if (
          role === "employee" &&
          (!(body as RegisterInput).employeeProfile?.regionIds.length ||
            !(body as RegisterInput).employeeProfile?.specializationIds.length)
        )
          throw new Error("Оберіть регіон та спеціалізацію.");
      }
      const r = await api.post<Session>(
        register ? "/auth/register" : "/auth/login",
        body,
      );
      if (r.data.accessToken) applySession(r.data);
      else await refresh();
      nav("/");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Link className="brand" to="/login">
          <span className="brand-icon">
            <Leaf />
          </span>
          Grave<span>Hub</span>
        </Link>
        <span className="auth-eyebrow">ЗБЕРІГАЄМО ТЕ, ЩО ВАЖЛИВО</span>
        <h1>
          Любов залишається.
          <br />
          Турбота триває.
        </h1>
        <p>
          Знаходьте людей, яким можна довірити догляд за місцями пам’яті. Будьте
          поруч — навіть на відстані.
        </p>
        <div className="auth-illustration">
          <div className="sun" />
          <div className="hill" />
          <div className="plant p1" />
          <div className="plant p2" />
        </div>
        <span className="auth-bottom">
          <ShieldCheck size={17} /> Простір поваги, довіри та пам’яті
        </span>
      </section>
      <section className="auth-form-area">
        <div className="auth-form">
          <span className="eyebrow">ВАШ ПРОСТІР ТУРБОТИ</span>
          <h1>{register ? "Створити обліковий запис" : "Раді бачити вас"}</h1>
          <p>
            {register
              ? "Почніть з кількох простих кроків."
              : "Увійдіть, щоб продовжити піклуватися."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <>
                <Field label="Ваше ім’я">
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    placeholder="Андрій Коваль"
                  />
                </Field>
                <Field label="Я хочу">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Mode)}
                  >
                    <option value="customer">Замовляти послуги</option>
                    <option value="employee">Надавати послуги</option>
                  </select>
                </Field>
              </>
            )}
            <Field label="Електронна пошта">
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Пароль">
              <input
                required
                name="password"
                type="password"
                minLength={register ? 6 : 1}
                maxLength={72}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="Введіть пароль"
              />
            </Field>
            {register && role === "employee" && (
              <EmployeeFields services={a.services} regions={a.regions} />
            )}
            {error && <ErrorBox text={error} />}
            <button className="button primary" disabled={busy}>
              {busy
                ? "Зачекайте…"
                : register
                  ? "Зареєструватися"
                  : "Увійти в кабінет"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-link">
            {register
              ? "Вже маєте обліковий запис?"
              : "Ще немає облікового запису?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Увійти" : "Зареєструватися"}
            </Link>
          </p>
          {!configured && (
            <div className="demo-entry">
              <span>Познайомтеся з GraveHub</span>
              <p>
                Перегляньте можливості на прикладі демонстраційних замовлень.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  a.setDemo();
                  nav("/");
                }}
              >
                Переглянути демоверсію <ArrowUpRight size={16} />
              </button>
            </div>
          )}
        </div>
        <small className="auth-footer">
          З турботою про тих, кого пам’ятаємо.
        </small>
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
