import {
ArrowUpRight,
ChevronRight,
ClipboardList,
Flower2,
Heart,
LayoutDashboard,
Leaf,
LogOut,
MapPin,
Menu,
MessageCircle,
Moon,
Search,
Send,
ShieldCheck,
Sun,
UserRound
} from "lucide-react";
import React,{
useEffect,
useState
} from "react";
import {
Link,
NavLink,
useNavigate
} from "react-router-dom";
import {
errorText
} from "../api";
import "../style.css";
import { useApp } from './useApp';
import { NotificationBell } from "./NotificationBell";
export function Shell({ children }: { children: React.ReactNode }) {
  const a = useApp(),
    [mobile, setMobile] = useState(false),
    [theme, setTheme] = useState<"light" | "dark">(() => {
      const saved = localStorage.getItem("gravehub-theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }),
    nav = useNavigate();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.body.dataset.theme = theme;
    document.body.style.background = theme === "dark" ? "#111713" : "#f7f8fa";
    document.body.style.color = theme === "dark" ? "#dde7df" : "#263c32";
    localStorage.setItem("gravehub-theme", theme);
  }, [theme]);
  const hasCustomerRole = a.session?.user.roles.includes("customer") ?? false;
  const hasEmployeeRole = a.session?.user.roles.includes("employee") ?? false;
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
    ...(a.mode === "customer"
      ? [
          { to: "/map", icon: MapPin, text: "Карта кладовища" },
          { to: "/plots", icon: MapPin, text: "Мої місця" },
          { to: "/employees", icon: Search, text: "Знайти виконавця" },
        ]
      : []),
    { to: "/services", icon: Flower2, text: "Послуги" },
    { to: "/messages", icon: MessageCircle, text: "Повідомлення" },
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
        {hasCustomerRole && hasEmployeeRole ? (
          <div className="mode-switch">
            <button
              className={a.mode === "customer" ? "selected" : ""}
              onClick={() =>
                a.switchMode("customer")
                  .then(() => nav("/"))
                  .catch((e) => a.notice(errorText(e)))
              }
            >
              Замовник
            </button>
            <button
              className={a.mode === "employee" ? "selected" : ""}
              onClick={() =>
                a.switchMode("employee")
                  .then(() => nav("/"))
                  .catch((e) => a.notice(errorText(e)))
              }
            >
              Працівник
            </button>
          </div>
        ) : (
          <button
            className="mode-switch add-role-button"
            onClick={() => nav("/profile")}
          >
            Додати роль {hasCustomerRole ? "працівника" : "замовника"}
          </button>
        )}
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
            aria-label="Відкрити меню" className="mobile-menu icon-button"
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
            <NotificationBell />
            <button
              className="icon-button theme-toggle"
              title={theme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
              aria-label={theme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
              aria-pressed={theme === "dark"}
              onClick={() => {
                const next = theme === "light" ? "dark" : "light";
                document.documentElement.dataset.theme = next;
                document.documentElement.style.colorScheme = next;
                document.body.dataset.theme = next;
                document.body.style.background = next === "dark" ? "#111713" : "#f7f8fa";
                document.body.style.color = next === "dark" ? "#dde7df" : "#263c32";
                localStorage.setItem("gravehub-theme", next);
                setTheme(next);
              }}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
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