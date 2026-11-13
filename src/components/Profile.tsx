import {
Check,
LogOut
} from "lucide-react";
import {
useState
} from "react";
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
        <h3>Відомі ролі</h3><p>Після перезавантаження токен підтверджує лише активну роль. Для іншої ролі спочатку спробуйте перемкнути режим; сервер перевірить доступ.</p>
        <div className="role-list">
          {a.session?.user.roles.map((r) => (
            <span className="badge completed" key={r}>
              <Check size={13} />
              {r === "customer" ? "Замовник" : "Виконавець"}
            </span>
          ))}
        </div>
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
            <h3>Стати виконавцем</h3>
            <EmployeeFields services={a.services} regions={a.regions} />
            {error && <ErrorBox text={error} />}
            <button className="button primary" disabled={busy}>
              Запросити роль виконавця
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
            Запросити роль замовника
          </button>
        )}
        <button className="button secondary logout" onClick={() => a.logout()}>
          <LogOut size={16} /> Вийти з облікового запису
        </button>
      </section>
    </>
  );
}