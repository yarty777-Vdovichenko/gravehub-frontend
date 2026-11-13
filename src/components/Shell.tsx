import {
ArrowUpRight,
ChevronRight,
ClipboardList,
Flower2,
Heart,
LayoutDashboard,
Leaf,
LogOut,
Menu,
Search,
Send,
ShieldCheck,
UserRound
} from "lucide-react";
import React,{
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
export function Shell({ children }: { children: React.ReactNode }) {
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
    
    { to: "/employees", icon: Search, text: "Знайти виконавця" },
    
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