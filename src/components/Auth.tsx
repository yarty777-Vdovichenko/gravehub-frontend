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
import { useApp } from './useApp';
export function Auth({ register = false }: { register?: boolean }) {
  const a = useApp(),
    nav = useNavigate(),
    [role, setRole] = useState<Mode>("customer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const location = useLocation();
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [emailValue,setEmailValue]=useState("");
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
      if(register){setRegisteredEmail(String(body.email));return;}
      if (r.data.accessToken) applySession(r.data);
      else await refresh();
      nav(typeof location.state?.from==="string" && location.state.from.startsWith("/") && !location.state.from.startsWith("//")?location.state.from:"/",{replace:true});
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if(register && registeredEmail) return <div className="auth-page"><section className="auth-form-area"><div className="auth-form"><h1>Підтвердіть пошту</h1><p>Ми надіслали лист на <b>{registeredEmail}</b>. Перейдіть за посиланням у листі, щоб активувати акаунт.</p><button className="button primary" onClick={async()=>{try{await api.post("/auth/resend-verification",{email:registeredEmail});setError("Лист повторно надіслано (якщо акаунт існує і пошта не підтверджена).") }catch(e){setError(errorText(e))}}}>Надіслати лист повторно</button>{error&&<ErrorBox text={error}/>}<p><Link to="/login">Повернутися до входу</Link></p></div></section></div>;
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
                value={emailValue}
                onChange={e=>setEmailValue(e.target.value)}
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
            {!register && <div className="auth-link"><Link to="/forgot-password">Забули пароль?</Link> · <button type="button" className="link-button" onClick={async()=>{setError("");try{await api.post("/auth/resend-verification",{email:emailValue});setError("Якщо акаунт існує і пошта не підтверджена, лист буде надіслано.")}catch(e){setError(errorText(e))}}}>Надіслати лист підтвердження повторно</button></div>}
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

export function AuthFlow({kind}:{kind:"verify"|"reset"|"forgot"}) {
 const location=useLocation(), [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const token=new URLSearchParams(location.search).get("token")||"";
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");try{if(kind==="forgot"){await api.post("/auth/forgot-password",{email});setMessage("Якщо акаунт існує, лист для відновлення буде надіслано.");}else if(kind==="verify"){if(!token)throw new Error("У посиланні відсутній token.");await api.post("/auth/verify-email",{token});setMessage("Пошту підтверджено. Тепер можете увійти.");}else{if(!token)throw new Error("У посиланні відсутній token.");await api.post("/auth/reset-password",{token,newPassword:password});setMessage("Пароль змінено. Увійдіть із новим паролем.");}}catch(e){setError(errorText(e))}finally{setBusy(false)}}
 return <div className="auth-page"><section className="auth-form-area"><div className="auth-form"><h1>{kind==="verify"?"Підтвердження пошти":kind==="forgot"?"Забули пароль?":"Відновлення пароля"}</h1>{kind==="forgot"?<form onSubmit={submit}><Field label="Електронна пошта"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></Field><button className="button primary" disabled={busy}>{busy?"Надсилання…":"Надіслати лист"}</button></form>:kind==="verify"?<form onSubmit={submit}><p>Підтвердіть адресу електронної пошти за посиланням із листа.</p><button className="button primary" disabled={busy}>{busy?"Перевіряємо…":"Підтвердити пошту"}</button></form>:<form onSubmit={submit}><Field label="Новий пароль"><input type="password" minLength={8} maxLength={72} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/></Field><button className="button primary" disabled={busy}>{busy?"Збереження…":"Змінити пароль"}</button></form>}{message&&<p>{message}</p>}{error&&<ErrorBox text={error}/>}<p><Link to="/login">До входу</Link></p></div></section></div>;
}
