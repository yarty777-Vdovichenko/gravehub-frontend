import {
Check,
LogOut
} from "lucide-react";
import {
useState
} from "react";
import type { Session } from "../api";
import { api,applySession,errorText } from '../api';
import "../style.css";
import { EmployeeFields } from './EmployeeFields';
import { employeeInput } from './employeeInput';
import { ErrorBox } from './ErrorBox';
import { PageTitle } from './PageTitle';
import { useApp } from './useApp';
import { EmployeeProfileEditor } from "./EmployeeProfileEditor";
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
        <h3>Ролі акаунта</h3>
        <div className="role-list">
          {a.session?.user.roles.map((r) => (
            <span className="badge completed" key={r}>
              <Check size={13} />
              {r === "customer" ? "Замовник" : "Працівник"}
              {r === a.mode && " · активна"}
            </span>
          ))}
        </div>
        {a.session?.user.roles.includes("employee") && a.mode === "employee" && (
          <EmployeeProfileEditor services={a.services} regions={a.regions} />
        )}
        {a.session?.user.roles.includes("employee") && a.mode !== "employee" && (
          <p className="profile-mode-hint">
            Щоб редагувати профіль виконавця, перемкніть режим на «Працівник».
          </p>
        )}
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
                const result=await api.post<Session>("/auth/roles/employee", body);
                applySession(result.data);
                a.notice("Роль виконавця додано");
              } catch (e) {
                const msg=errorText(e);if(msg.toLowerCase().includes("already have")||msg.toLowerCase().includes("вже маєте")||msg.toLowerCase().includes("вже існує")){try{await a.switchMode("employee");setError("");a.notice("Роль виконавця вже є; режим перемкнено")}catch(x){setError(errorText(x))}}else setError(msg);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>Стати виконавцем</h3>
            <EmployeeFields
              services={a.services}
              regions={a.regions}
              regionsLoading={a.regionsLoading}
              regionsError={a.regionsError}
              retryRegions={() => void a.reloadRegions()}
            />
            {error && <ErrorBox text={error} />}
            <button
              className="button primary"
              disabled={busy || a.regionsLoading || !!a.regionsError || a.regions.length === 0}
            >
              Запросити роль виконавця
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
                const result=await api.post<Session>("/auth/roles/customer");
                applySession(result.data);
                a.notice("Роль замовника додано");
              } catch (e) {
                const msg=errorText(e);
                if(msg.toLowerCase().includes("already have")||msg.toLowerCase().includes("вже маєте")||msg.toLowerCase().includes("вже існує")){try{await a.switchMode("customer");a.notice("Роль замовника вже є; режим перемкнено")}catch(x){a.notice(errorText(x))}}else a.notice(msg);
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