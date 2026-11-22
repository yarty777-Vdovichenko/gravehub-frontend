import {
ArrowRight,
ChevronLeft
} from "lucide-react";
import React,{
useEffect,
useState
} from "react";
import {
Link,
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
import type { OwnedPlot } from "../new-api";
import { newApi } from "../new-api";
import "../style.css";
import { demoUuid } from './demoUuid';
import { ErrorBox } from './ErrorBox';
import { Field } from './Field';
import { PageTitle } from './PageTitle';
import { ServiceTreePicker } from "./ServiceTreePicker";
import { useApp } from './useApp';
export function NewContract() {
  const a = useApp(),
    nav = useNavigate(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [locationType, setLocationType] = useState<"coordinates" | "burial_plot" | "address">("coordinates"),
    [ownedPlots, setOwnedPlots] = useState<OwnedPlot[]>([]),
    [plotsLoading, setPlotsLoading] = useState(false),
    [plotsError, setPlotsError] = useState(""),
    [selectedPlotId, setSelectedPlotId] = useState(""),
    [address, setAddress] = useState(""),
    [selectedServices, setSelectedServices] = useState<string[]>(() => {
      const service = new URLSearchParams(window.location.search).get("service");
      return service ? [service] : [];
    }),
    [estimate, setEstimate] = useState<number>(),
    [estimateError, setEstimateError] = useState(""),
    [budget, setBudget] = useState(""),
    [regionId, setRegionId] = useState(""),
    [pendingContract, setPendingContract] = useState<ContractInput>(),
    [paymentBusy, setPaymentBusy] = useState(false);
  useEffect(() => {
    if (a.demo || locationType !== "burial_plot") {
      setOwnedPlots([]);
      setPlotsLoading(false);
      return;
    }
    let active = true;
    setPlotsLoading(true);
    setPlotsError("");
    newApi
      .mine()
      .then((items) => {
        if (active) setOwnedPlots(items);
      })
      .catch((e: unknown) => {
        if (active) setPlotsError(errorText(e));
      })
      .finally(() => {
        if (active) setPlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [a.demo, locationType]);
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
  const selectedOwnedPlot = ownedPlots.find((plot) => plot.id === selectedPlotId);
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
      if (!selectedPlotId) {
        setError("Оберіть придбану ділянку.");
        return;
      }
      body.burialPlotId = selectedPlotId;
      const plot = ownedPlots.find((item) => item.id === selectedPlotId);
      const city = plot?.cemetery.city.trim();
      const autoRegion = a.regions.find((item) =>
        city
          ? item.name.toLocaleLowerCase("uk-UA").includes(city.toLocaleLowerCase("uk-UA")) ||
            city.toLocaleLowerCase("uk-UA").includes(item.name.toLocaleLowerCase("uk-UA"))
          : false,
      );
      body.regionId = autoRegion?.id ?? regionId;
      if (!body.regionId) {
        setError("Не вдалося визначити регіон для вибраної могили.");
        return;
      }
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
    setPendingContract(body);
  }
  async function confirmMockPayment() {
    if (!pendingContract) return;
    setPaymentBusy(true);
    setBusy(true);
    try {
      if (a.demo) {
        const c: Contract = {
          ...pendingContract,
          id: demoUuid(),
          status: "open",
          region: a.regions.find((r) => r.id === pendingContract.regionId),
          serviceTypes: a.services.filter((s) => pendingContract.serviceTypeIds.includes(s.id)),
          proposalsCount: 0,
        };
        a.setContracts((cs) => [c, ...cs]);
        nav("/contracts/" + c.id);
      } else {
        const r = await api.post<Contract>("/contracts", pendingContract);
        nav("/contracts/" + r.data.id);
      }
      setPendingContract(undefined);
      a.notice("Замовлення створено");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
      setPaymentBusy(false);
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
        {locationType === "burial_plot" && selectedOwnedPlot ? (
          <div className="plot-selection-banner">
            <div>
              <b>
                {selectedOwnedPlot.cemetery.name} · місце {selectedOwnedPlot.positionX + 1}-{selectedOwnedPlot.positionY + 1}
              </b>
              <p>Ваше придбане місце · {selectedOwnedPlot.cemetery.city}.</p>
            </div>
          </div>
        ) : null}
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
            required
            rows={4}
            placeholder="Опишіть обсяг роботи, особливості та ваші побажання"
          />
        </Field>
        <div className="form-grid">
          <div className="field">
            <span>Послуги</span>
            <ServiceTreePicker
              categories={a.serviceCategories}
              services={a.services}
              mode="contract"
              selectedIds={selectedServices}
              onChange={setSelectedServices}
              name="serviceTypeIds"
            />
            {a.servicesLoading && (
              <small role="status">Завантаження послуг…</small>
            )}
            {a.servicesError && <ErrorBox text={a.servicesError} />}
            {!a.servicesLoading && !a.servicesError && !a.services.length && (
              <small>Список послуг порожній. Попросіть адміністратора заповнити послуги.</small>
            )}
          </div>
          <Field label="Регіон">
            <select
              required
              name="regionId"
              value={regionId}
              disabled={locationType === "burial_plot"}
              onChange={(event) => setRegionId(event.currentTarget.value)}
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
          {locationType === "burial_plot" && (
            <Field label="Придбана ділянка">
              <select
                name="burialPlotId"
                required
                value={selectedPlotId}
                onChange={(event) => {
                  const plotId = event.currentTarget.value;
                  setSelectedPlotId(plotId);
                  const plot = ownedPlots.find((item) => item.id === plotId);
                  const city = plot?.cemetery.city.trim();
                  const autoRegion = a.regions.find((item) =>
                    city
                      ? item.name.toLocaleLowerCase("uk-UA").includes(city.toLocaleLowerCase("uk-UA")) ||
                        city.toLocaleLowerCase("uk-UA").includes(item.name.toLocaleLowerCase("uk-UA"))
                      : false,
                  );
                  setRegionId(autoRegion?.id ?? "");
                }}
              >
                <option value="">Оберіть ділянку</option>
                {ownedPlots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.cemetery.name} · {plot.cemetery.city} · місце {plot.positionX + 1}-{plot.positionY + 1}
                  </option>
                ))}
              </select>
              {plotsLoading && <small role="status">Завантаження придбаних ділянок…</small>}
              {plotsError && <ErrorBox text={plotsError} />}
              {!plotsLoading && !plotsError && !ownedPlots.length && (
                <small>Придбаних ділянок поки немає.</small>
              )}
            </Field>
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
            {busy ? "Перевірка…" : "Перейти до оплати"}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
      {pendingContract && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !paymentBusy) setPendingContract(undefined);
          }}
        >
          <section className="panel modal" role="dialog" aria-modal="true" aria-label="Оплата замовлення">
            <button
              type="button"
              className="close"
              aria-label="Закрити оплату"
              disabled={paymentBusy}
              onClick={() => setPendingContract(undefined)}
            >
              ×
            </button>
            <h2>Мокова оплата замовлення</h2>
            <p>Без списання коштів. Платіж підтверджується автоматично.</p>
            <label className="field">
              <span>Номер картки</span>
              <input value="4242 4242 4242 4242" readOnly />
            </label>
            <strong>{pendingContract.budget.toLocaleString("uk-UA")} ₴</strong>
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                disabled={paymentBusy}
                onClick={() => setPendingContract(undefined)}
              >
                Скасувати
              </button>
              <button
                className="button primary"
                type="button"
                disabled={paymentBusy}
                onClick={() => void confirmMockPayment()}
              >
                {paymentBusy ? "Оплата…" : "Підтвердити оплату"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}