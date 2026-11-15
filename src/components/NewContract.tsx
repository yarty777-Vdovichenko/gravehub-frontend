import {
ArrowRight,
ChevronLeft,
MapPin
} from "lucide-react";
import React,{
useState
} from "react";
import {
Link,
useLocation,
useNavigate
} from "react-router-dom";
import type {
Contract,
ContractInput
} from "../api";
import {
api,
errorText
} from "../api";
import "../style.css";
import { demoUuid } from './demoUuid';
import { ErrorBox } from './ErrorBox';
import { Field } from './Field';
import { PageTitle } from './PageTitle';
import { readPlotSelection } from './readPlotSelection';
import { useApp } from './useApp';
export function NewContract() {
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
    if(!Number.isInteger(body.positionX)||body.positionX<0||!Number.isInteger(body.positionY)||body.positionY<0){setError('Координати мають бути цілими числами ≥ 0');return;}
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
              step="1"
              required
              placeholder="12"
            />
          </Field>
          <Field label="Координата Y">
            <input
              name="positionY"
              defaultValue={selection?.positionY}
              type="number"
              min="0"
              step="1"
              required
              placeholder="8"
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