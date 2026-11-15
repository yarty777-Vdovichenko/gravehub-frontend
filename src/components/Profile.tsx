import {
Check,
LogOut
} from "lucide-react";
import {
useEffect,
useRef,
useState
} from "react";
import {
useLocation
} from "react-router-dom";
import type {
Session
} from "../api";
import { api,applySession,canRequestRole,errorText } from '../api';
import "../style.css";
import { EmployeeFields } from './EmployeeFields';
import { employeeInput } from './employeeInput';
import { ErrorBox } from './ErrorBox';
import { PageTitle } from './PageTitle';
import { useApp } from './useApp';
export function Profile() {
  const a = useApp(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    location = useLocation(),
    addRoleRef = useRef<HTMLDivElement>(null),
    rolesKnown = a.session?.user.rolesComplete === true;
  // Перехід із кнопки «Додати роль» у боковому меню: показуємо блок додавання ролі.
  useEffect(() => {
    if ((location.state as { addRole?: string } | null)?.addRole)
      addRoleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.state]);
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
        <h3>{rolesKnown ? "Мої ролі" : "Відомі ролі"}</h3>
        {!rolesKnown && (
          <p>
            Не вдалося отримати повний список ролей із сервера. Показано лише
            відомі. Для іншої ролі спробуйте перемкнути режим — сервер
            перевірить доступ.
          </p>
        )}
        <div className="role-list">
          {a.session?.user.roles.map((r) => (
            <span className="badge completed" key={r}>
              <Check size={13} />
              {r === "customer" ? "Замовник" : "Виконавець"}
            </span>
          ))}
        </div>
        <div ref={addRoleRef} />
        {canRequestRole("employee") && (
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
                const result=await api.post<Session>("/auth/roles/employee", body);
                applySession(result.data);
                a.notice("Роль виконавця додано");
              } catch (e) {
                setError(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>Додати роль виконавця</h3>
            <EmployeeFields services={a.services} regions={a.regions} />
            {error && <ErrorBox text={error} />}
            <button className="button primary" disabled={busy}>
              Додати роль виконавця
            </button>
          </form>
        )}
        {canRequestRole("customer") && (
          <button
            disabled={busy}
            className="button primary"
            onClick={async () => {
              setBusy(true);
              try {
                const result=await api.post<Session>("/auth/roles/customer");
                applySession(result.data);
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