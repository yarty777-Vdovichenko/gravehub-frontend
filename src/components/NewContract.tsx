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
ContractEstimate,
Contract,
ContractInput,
SelectableService,
ServiceCategory
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
    [estimate, setEstimate] = useState<ContractEstimate>(),
    [estimateError, setEstimateError] = useState(""),
    [budget, setBudget] = useState("");
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
    if (a.servicesLoading) {
      setEstimate(undefined);
      setEstimateError("");
      return;
    }

    if (!a.demo && a.servicesError) {
      setEstimate(undefined);
      setEstimateError(a.servicesError);
      return;
    }

    if (!selectedServices.length) {
      setEstimate(undefined);
      setEstimateError("");
      return;
    }

    if (
      !a.demo &&
      (!a.serviceCategories.length ||
        selectedServices.some(
          (id) => !a.serviceCategories.some((category) => category.id === id),
        ))
    ) {
      setEstimate(undefined);
      setEstimateError("");
      return;
    }

    if (a.demo) {
      const selectedCategories = a.serviceCategories.filter((category) =>
        selectedServices.includes(category.id),
      );
      const ranges = selectedCategories.length
        ? selectedCategories.map((category) => {
            const prices = category.children.map((service) => service.price ?? 0);
            return {
              id: category.id,
              name: category.name,
              minPrice: prices.length ? Math.min(...prices) : 0,
              maxPrice: prices.length ? Math.max(...prices) : 0,
            };
          })
        : a.services
            .filter((service) => selectedServices.includes(service.id))
            .map((service) => ({
              id: service.id,
              name: service.name,
              minPrice: service.price ?? 0,
              maxPrice: service.price ?? 0,
            }));
      setEstimate({
        services: ranges,
        minEstimatedPrice: ranges.reduce((sum, item) => sum + item.minPrice, 0),
        maxEstimatedPrice: ranges.reduce((sum, item) => sum + item.maxPrice, 0),
      });
      return;
    }

    const controller = new AbortController();
    setEstimateError("");
    api
      .post<ContractEstimate>(
        "/contracts/estimate",
        { serviceTypeIds: selectedServices },
        { signal: controller.signal },
      )
      .then(({ data }) => setEstimate(data))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setEstimate(undefined);
          setEstimateError(errorText(e));
        }
      });
    return () => controller.abort();
  }, [
    selectedServices,
    a.demo,
    a.services,
    a.serviceCategories,
    a.servicesLoading,
    a.servicesError,
  ]);
  useEffect(() => {
    if (a.servicesLoading || !a.serviceCategories.length) return;
    const categoryIds = new Set(a.serviceCategories.map((category) => category.id));
    const childCategories = new Map(
      a.serviceCategories.flatMap((category) =>
        category.children.map((service) => [service.id, category.id] as const),
      ),
    );
    setSelectedServices((current) => {
      const next = Array.from(
        new Set(
          current
            .map((id) =>
              categoryIds.has(id) ? id : childCategories.get(id),
            )
            .filter((id): id is string => Boolean(id)),
        ),
      );
      return next.length === current.length &&
        next.every((id, index) => id === current[index])
        ? current
        : next;
    });
  }, [a.servicesLoading, a.serviceCategories]);
  const selectedOwnedPlot = ownedPlots.find((plot) => plot.id === selectedPlotId);
  const renderService = (service: SelectableService) => (
    <label className="service-checkbox" key={service.id}>
      <input
        type="checkbox"
        name="serviceTypeIds"
        value={service.id}
        checked={selectedServices.includes(service.id)}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          setSelectedServices((current) =>
            checked
              ? [...current, service.id]
              : current.filter((id) => id !== service.id),
          );
        }}
      />
      <span>
        <b>{service.name}</b>
        {service.description && <small>{service.description}</small>}
      </span>
      {service.price !== undefined && (
        <strong>{service.price.toLocaleString("uk-UA")} ₴</strong>
      )}
    </label>
  );
  const renderCategory = (category: ServiceCategory) => (
    <label className="service-checkbox" key={category.id}>
      <input
        type="checkbox"
        name="serviceTypeIds"
        value={category.id}
        checked={selectedServices.includes(category.id)}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          setSelectedServices((current) =>
            checked
              ? [...current, category.id]
              : current.filter((id) => id !== category.id),
          );
        }}
      />
      <span>
        <b>{category.name}</b>
        {category.description && <small>{category.description}</small>}
        {!!category.children.length && (
          <small>
            Включає: {category.children.map((service) => service.name).join(", ")}
          </small>
        )}
      </span>
    </label>
  );
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
          serviceTypes: a.serviceCategories.length
            ? a.serviceCategories.filter((category) =>
                body.serviceTypeIds.includes(category.id),
              )
            : a.services
                .filter((service) => body.serviceTypeIds.includes(service.id))
                .map((service) => ({ ...service, children: [] })),
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
            {a.serviceCategories.length ? (
              <div className="service-checkboxes" role="group" aria-label="Категорії послуг">
                {a.serviceCategories.map(renderCategory)}
              </div>
            ) : (
              <div className="service-checkboxes" role="group" aria-label="Послуги">
                {a.demo && a.services.map(renderService)}
              </div>
            )}
            {a.servicesLoading && (
              <small role="status">Завантаження послуг…</small>
            )}
            {a.servicesError && <ErrorBox text={a.servicesError} />}
            {!a.servicesLoading &&
              !a.servicesError &&
              !a.serviceCategories.length &&
              (!a.demo || !a.services.length) && (
              <small>Список послуг порожній. Попросіть адміністратора заповнити послуги.</small>
              )}
          </div>
          <Field label="Регіон">
            <select
              required
              name="regionId"
              defaultValue=""
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
                onChange={(event) => setSelectedPlotId(event.currentTarget.value)}
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
              <span>Орієнтовний діапазон вартості послуг</span>
              <strong>
                {estimate.minEstimatedPrice.toLocaleString("uk-UA")}–{estimate.maxEstimatedPrice.toLocaleString("uk-UA")} ₴
              </strong>
              <ul>
                {estimate.services.map((service) => (
                  <li key={service.id}>
                    {service.name}: {service.minPrice.toLocaleString("uk-UA")}–{service.maxPrice.toLocaleString("uk-UA")} ₴
                  </li>
                ))}
              </ul>
              <small>Бюджет замовлення вкажіть самостійно.</small>
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