import {
ArrowRight,
ArrowUpRight,
Leaf,
ShieldCheck
} from "lucide-react";
import React,{
useEffect,
useState
} from "react";
import {
Link,
Navigate,
useLocation,
useNavigate
} from "react-router-dom";
import type {
Mode,
RegisterInput,
Session
} from "../api";
import {
api,
applySession,
configured,
errorText,
refresh
} from "../api";
import "../style.css";
import { EmployeeFields } from './EmployeeFields';
import { employeeInput } from './employeeInput';
import { ErrorBox } from './ErrorBox';
import { Field } from './Field';
import { ResendVerification } from './ResendVerification';
import { useApp } from './useApp';
export function Auth({ register = false }: { register?: boolean }) {
  const a = useApp(),
    nav = useNavigate(),
    [role, setRole] = useState<Mode>("customer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sentTo, setSentTo] = useState(""),
    [unverifiedEmail, setUnverifiedEmail] = useState("");
  const location = useLocation();
  useEffect(() => {
    setError("");
    setSentTo("");
    setUnverifiedEmail("");
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
    setUnverifiedEmail("");
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
      if (register) {
        // Реєстрація не створює сесію: спершу потрібно підтвердити пошту.
        await api.post<{ message: string }>("/auth/register", body);
        setSentTo(body.email);
        return;
      }
      const r = await api.post<Session>("/auth/login", body);
      if (r.data.accessToken) applySession(r.data);
      else await refresh();
      nav(typeof location.state?.from==="string" && location.state.from.startsWith("/") && !location.state.from.startsWith("//")?location.state.from:"/");
    } catch (e) {
      const text = errorText(e);
      setError(text);
      if (!register && /пошт/i.test(text))
        setUnverifiedEmail(String(f.get("email")));
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
          {sentTo ? (
            <div className="check-email" role="status">
              <h2>Перевірте пошту</h2>
              <p>
                Ми надіслали лист із посиланням для підтвердження на{" "}
                <b>{sentTo}</b>. Посилання діє 24 години. Після підтвердження
                можна увійти в кабінет.
              </p>
              <ResendVerification email={sentTo} />
              <p className="auth-link">
                <Link to="/login">Перейти до входу</Link>
              </p>
            </div>
          ) : (
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
            {unverifiedEmail && <ResendVerification email={unverifiedEmail} />}
            {!register && (
              <p className="auth-link forgot-link">
                <Link to="/forgot-password">Забули пароль?</Link>
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy
                ? "Зачекайте…"
                : register
                  ? "Зареєструватися"
                  : "Увійти в кабінет"}
              <ArrowRight size={17} />
            </button>
          </form>
          )}
          {!sentTo && <p className="auth-link">
            {register
              ? "Вже маєте обліковий запис?"
              : "Ще немає облікового запису?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Увійти" : "Зареєструватися"}
            </Link>
          </p>}
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