import {
ArrowRight,
ChevronLeft,
MapPin
} from "lucide-react";
import React,{
useEffect,
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
    [error, setError] = useState(""),
    [locationType, setLocationType] = useState<"coordinates" | "burial_plot" | "address">(
      () => readPlotSelection(location.state) ? "burial_plot" : "coordinates",
    ),
    [address, setAddress] = useState(""),
    [selectedServices, setSelectedServices] = useState<string[]>(() => {
      const service = new URLSearchParams(window.location.search).get("service");
      return service ? [service] : [];
    }),
    [estimate, setEstimate] = useState<number>(),
    [estimateError, setEstimateError] = useState(""),
    [budget, setBudget] = useState("");
  useEffect(() => {
    if (!selectedServices.length) {
      setEstimate(undefined);
      setEstimateError("");
      return;
    }

    if (a.demo) {
      setEstimate(
        a.services
          .filter((service) => selectedServices.includes(service.id))
          .reduce((total, service) => total + (service.price ?? 0), 0),
      );
      return;
    }

    const controller = new AbortController();
    setEstimateError("");
    api
      .post<{ estimatedPrice: number }>("/contracts/estimate", {
        serviceTypeIds: selectedServices,
      }, { signal: controller.signal })
      .then(({ data }) => setEstimate(data.estimatedPrice))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setEstimate(undefined);
          setEstimateError(errorText(e));
        }
      });
    return () => controller.abort();
  }, [selectedServices, a.demo, a.services]);
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
      serviceTypeIds: f.getAll("serviceTypeIds").map(String),
      regionId: String(f.get("regionId")),
      locationType,
      date: date.toISOString(),
      budget: Number(f.get("budget")),
    };
    if (locationType === "coordinates") {
      body.positionX = Number(f.get("positionX"));
      body.positionY = Number(f.get("positionY"));
      if (!Number.isInteger(body.positionX) || body.positionX < 0 || !Number.isInteger(body.positionY) || body.positionY < 0) {
        setError("Координати мають бути цілими числами ≥ 0");
        return;
      }
    } else if (locationType === "burial_plot") {
      if (!selection) {
        setError("Оберіть місце на карті кладовища.");
        return;
      }
      body.burialPlotId = selection.id;
    } else {
      body.address = address.trim();
      if (!body.address) {
        setError("Вкажіть адресу виконання робіт.");
        return;
      }
    }
    if (!body.serviceTypeIds.length) {
      setError("Оберіть хоча б одну послугу.");
      return;
    }
    if (!Number.isFinite(body.budget) || body.budget <= 0) {
      setError("Вкажіть бюджет, більший за нуль.");
      return;
    }
    setBusy(true);
    try {
      if (a.demo) {
        const c: Contract = {
          ...body,
          id: demoUuid(),
          status: "open",
          region: a.regions.find((r) => r.id === body.regionId),
          serviceTypes: a.services.filter((s) => body.serviceTypeIds.includes(s.id)),
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
          <Field label="Послуги">
            <div className="service-checkboxes" role="group" aria-label="Послуги">
              {a.services.map((s) => (
                <label className="service-checkbox" key={s.id}>
                  <input
                    type="checkbox"
                    name="serviceTypeIds"
                    value={s.id}
                    checked={selectedServices.includes(s.id)}
                    onChange={(event) => {
                      setSelectedServices((current) =>
                        event.currentTarget.checked
                          ? [...current, s.id]
                          : current.filter((id) => id !== s.id),
                      );
                    }}
                  />
                  <span>
                    <b>{s.name}</b>
                    {s.description && <small>{s.description}</small>}
                  </span>
                  {s.price !== undefined && (
                    <strong>{s.price.toLocaleString("uk-UA")} ₴</strong>
                  )}
                </label>
              ))}
              {!a.services.length && (
                <small>Список послуг порожній. Попросіть адміністратора заповнити послуги.</small>
              )}
            </div>
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
          <Field label="Тип місця">
            <select
              name="locationType"
              value={locationType}
              onChange={(event) => setLocationType(event.currentTarget.value as typeof locationType)}
              disabled={!!selection}
            >
              <option value="coordinates">Координати</option>
              <option value="burial_plot">Місце на кладовищі</option>
              <option value="address">Адреса</option>
            </select>
          </Field>
          {locationType === "coordinates" && (
            <>
              <Field label="Координата X">
                <input name="positionX" type="number" min="0" step="1" required placeholder="12" />
              </Field>
              <Field label="Координата Y">
                <input name="positionY" type="number" min="0" step="1" required placeholder="8" />
              </Field>
            </>
          )}
          {locationType === "address" && (
            <Field label="Адреса виконання робіт">
              <input
                name="address"
                required
                maxLength={500}
                value={address}
                onChange={(event) => setAddress(event.currentTarget.value)}
                placeholder="Місто, вулиця, будинок"
              />
            </Field>
          )}
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
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="1200"
            />
          </Field>
        </div>
        <div className="estimate-box" aria-live="polite">
          {estimate !== undefined && (
            <>
              <span>Орієнтовна вартість вибраних послуг</span>
              <strong>{estimate.toLocaleString("uk-UA")} ₴</strong>
              <button
                type="button"
                className="link-button"
                onClick={() => setBudget(String(estimate))}
              >
                Встановити бюджет
              </button>
            </>
          )}
          {estimateError && <p className="error">{estimateError}</p>}
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