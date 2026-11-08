import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { api, errorText, configured } from "./api";
import type { Option, Contract, Page, Review } from "./api";
import { newApi } from "./new-api";
import type {
  Employee,
  MetaPage,
  Cemetery,
  BurialPlot,
  OwnedPlot,
  Reservation,
  Credit,
  SearchFilters,
} from "./new-api";
import "./new-pages.css";
const cash = (n: number) => new Intl.NumberFormat("uk-UA").format(n) + " ₴";
function ErrorView({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="error">
      {error}
    </div>
  ) : null;
}
function Pager({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        ←
      </button>
      Сторінка {page} з {Math.max(1, pages)}
      <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
        →
      </button>
    </div>
  );
}
function Filters({
  services,
  regions,
  employee,
  onChange,
}: {
  services: Option[];
  regions: Option[];
  employee: boolean;
  onChange: (f: Omit<SearchFilters, "page" | "limit">, limit: number) => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      className="panel filter-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const min = String(d.get("minBudget") ?? ""),
          max = String(d.get("maxBudget") ?? "");
        if (min && max && Number(min) > Number(max)) {
          setError("Мінімальний бюджет перевищує максимальний.");
          return;
        }
        setError("");
        onChange(
          {
            search: String(d.get("search") ?? "").trim() || undefined,
            serviceId: String(d.get("serviceId")) || undefined,
            regionId: String(d.get("regionId")) || undefined,
            ...(employee
              ? {
                  minRating:
                    d.get("minRating") === ""
                      ? undefined
                      : Number(d.get("minRating")),
                }
              : {
                  minBudget: min ? Number(min) : undefined,
                  maxBudget: max ? Number(max) : undefined,
                }),
            sortBy: String(d.get("sortBy")),
            order: d.get("order") === "asc" ? "asc" : "desc",
          },
          Number(d.get("limit")),
        );
      }}
    >
      <input
        name="search"
        maxLength={100}
        placeholder={employee ? "Ім’я виконавця" : "Пошук замовлень"}
        aria-label="Пошук"
      />
      <select name="regionId" aria-label="Регіон">
        <option value="">Усі регіони</option>
        {regions.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <select name="serviceId" aria-label="Послуга">
        <option value="">Усі послуги</option>
        {services.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      {employee ? (
        <input
          name="minRating"
          type="number"
          min={0}
          max={5}
          step="0.1"
          placeholder="Рейтинг від"
          aria-label="Мінімальний рейтинг"
        />
      ) : (
        <>
          <input
            type="number"
            name="minBudget"
            min={0}
            step={1}
            placeholder="Бюджет від"
            aria-label="Бюджет від"
          />
          <input
            type="number"
            name="maxBudget"
            min={0}
            step={1}
            placeholder="Бюджет до"
            aria-label="Бюджет до"
          />
        </>
      )}
      <select name="sortBy" aria-label="Сортування">
        {(employee
          ? [
              ["rating", "За рейтингом"],
              ["completedContracts", "За кількістю робіт"],
            ]
          : [
              ["createdAt", "За датою"],
              ["budget", "За бюджетом"],
            ]
        ).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <select name="order" aria-label="Порядок">
        <option value="desc">За спаданням</option>
        <option value="asc">За зростанням</option>
      </select>
      <select name="limit" aria-label="На сторінці">
        {[10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n} на сторінці
          </option>
        ))}
      </select>
      <button className="button primary">Застосувати</button>
      <ErrorView error={error} />
    </form>
  );
}
export function Directory({
  services,
  regions,
}: {
  services: Option[];
  regions: Option[];
}) {
  const { id } = useParams(),
    [profile, setProfile] = useState<Employee>(),
    [data, setData] = useState<MetaPage<Employee>>(),
    [reviews, setReviews] = useState<Page<Review>>(),
    [reviewPage, setReviewPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(10),
    [filters, setFilters] = useState<Omit<SearchFilters, "page" | "limit">>({
      sortBy: "rating",
      order: "desc",
    });
  useEffect(() => {
    const c = new AbortController();
    setBusy(true);
    setError("");
    setData(undefined);
    setProfile(undefined);
    (id
      ? newApi.employee(id).then(setProfile)
      : newApi.employees({ ...filters, page, limit }, c.signal).then(setData)
    )
      .catch((e) => {
        if (!axios.isCancel(e)) setError(errorText(e));
      })
      .finally(() => setBusy(false));
    return () => c.abort();
  }, [id, page, limit, filters]);
  useEffect(() => {
    if (!id) return;
    api
      .get<Page<Review>>(`/employees/${id}/reviews`, {
        params: { page: reviewPage, limit: 10 },
      })
      .then((r) => setReviews(r.data))
      .catch((e) => setError(errorText(e)));
  }, [id, reviewPage]);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{id ? "Профіль виконавця" : "Знайти виконавця"}</h1>
          <p>Пошук за досвідом, послугами, регіоном і рейтингом.</p>
        </div>
      </div>
      {!configured && (
        <p className="error">Для цього розділу налаштуйте VITE_API_URL.</p>
      )}
      {!id && (
        <Filters
          employee
          services={services}
          regions={regions}
          onChange={(f, n) => {
            setFilters(f);
            setLimit(n);
            setPage(1);
          }}
        />
      )}
      <ErrorView error={error} />
      {busy ? (
        <div className="loading">Завантаження…</div>
      ) : profile ? (
        <section className="panel detail-panel">
          <Link to="/employees">← До пошуку</Link>
          <h2>{profile.user.name}</h2>
          <p>
            ★ {profile.rating} · Виконано робіт: {profile.completedContracts}
          </p>
          <p>{profile.specialization.map((s) => s.name).join(", ")}</p>
          <p>{profile.regions.map((s) => s.name).join(", ")}</p>
          <h3>Відгуки</h3>
          {reviews?.items.length ? (
            reviews.items.map((r) => (
              <div className="review" key={r.id}>
                <b>
                  {r.rating} ★ · {r.customer?.name}
                </b>
                <p>{r.text}</p>
              </div>
            ))
          ) : (
            <p>Без відгуків</p>
          )}
          {reviews && (
            <Pager
              page={reviewPage}
              pages={reviews.totalPages ?? Math.ceil(reviews.total / 10)}
              setPage={setReviewPage}
            />
          )}
        </section>
      ) : (
        data && (
          <>
            <div className="service-grid">
              {data.items.map((x) => (
                <Link
                  className="panel detail-panel"
                  key={x.id}
                  to={"/employees/" + x.id}
                >
                  <h2>{x.user.name}</h2>
                  <p>
                    ★ {x.rating} · {x.completedContracts} виконаних робіт
                  </p>
                  <p>{x.specialization.map((s) => s.name).join(", ")}</p>
                  <p>{x.regions.map((s) => s.name).join(", ")}</p>
                  <b>Переглянути профіль →</b>
                </Link>
              ))}
            </div>
            {!data.items.length && (
              <div className="empty">Виконавців за цими умовами немає.</div>
            )}
            <Pager page={page} pages={data.meta.pages} setPage={setPage} />
          </>
        )
      )}
    </>
  );
}
export function AdvancedMarket({
  services,
  regions,
}: {
  services: Option[];
  regions: Option[];
}) {
  const [filters, setFilters] = useState<Omit<SearchFilters, "page" | "limit">>(
      { sortBy: "createdAt", order: "desc" },
    ),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(10),
    [data, setData] = useState<MetaPage<Contract>>(),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setData(undefined);
    setError("");
    api
      .get<MetaPage<Contract>>("/employee/contracts", {
        params: { ...filters, page, limit },
        signal: c.signal,
      })
      .then((r) => setData(r.data))
      .catch((e) => {
        if (!axios.isCancel(e)) setError(errorText(e));
      });
    return () => c.abort();
  }, [filters, page, limit]);
  return (
    <>
      <div className="page-title">
        <h1>Знайти замовлення</h1>
      </div>
      <Filters
        employee={false}
        services={services}
        regions={regions}
        onChange={(f, n) => {
          setFilters(f);
          setLimit(n);
          setPage(1);
        }}
      />
      <ErrorView error={error} />
      {!data && !error ? (
        <div className="loading">Завантаження…</div>
      ) : (
        data && (
          <section className="panel">
            {data.items.length ? (
              data.items.map((c) => (
                <Link
                  className="order-row"
                  key={c.id}
                  to={"/contracts/" + c.id}
                >
                  <div>
                    <h3>{c.title}</h3>
                    <p>
                      {c.region?.name} · {c.serviceType?.name}
                    </p>
                  </div>
                  <b>{cash(c.budget)}</b>
                </Link>
              ))
            ) : (
              <div className="empty">Замовлень за цими умовами немає.</div>
            )}
            <Pager page={page} pages={data.meta.pages} setPage={setPage} />
          </section>
        )
      )}
    </>
  );
}
export function LivePlots() {
  const location = useLocation(),
    mine = location.pathname === "/plots";
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]),
    [cemeteryId, setCemeteryId] = useState(""),
    [plots, setPlots] = useState<BurialPlot[]>([]),
    [owned, setOwned] = useState<OwnedPlot[]>([]),
    [selected, setSelected] = useState<BurialPlot>(),
    [reservation, setReservation] = useState<Reservation>(),
    [now, setNow] = useState(Date.now()),
    [paymentType, setPayment] = useState<"full" | "credit">("full"),
    [months, setMonths] = useState<6 | 12 | 24>(12),
    [down, setDown] = useState(0),
    [credit, setCredit] = useState<Credit>(),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const load = async () => {
    if (mine) setOwned(await newApi.mine());
    else if (cemeteryId) setPlots(await newApi.plots(cemeteryId));
  };
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    (mine
      ? newApi.mine().then((x) => {
          if (live) setOwned(x);
        })
      : newApi.cemeteries().then((x) => {
          if (live) {
            setCemeteries(x);
            setCemeteryId((v) => v || x[0]?.id || "");
          }
        })
    )
      .catch((e) => {
        if (live) setError(errorText(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [mine]);
  useEffect(() => {
    if (!cemeteryId || mine) return;
    let live = true;
    setLoading(true);
    setPlots([]);
    setSelected(undefined);
    newApi
      .plots(cemeteryId)
      .then((x) => {
        if (live) setPlots(x);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [cemeteryId, mine]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seconds = reservation
    ? Math.max(
        0,
        Math.ceil((Date.parse(reservation.reservedUntil) - now) / 1000),
      )
    : 0;
  useEffect(() => {
    if (reservation && seconds === 0) {
      setReservation(undefined);
      setCredit(undefined);
      setMessage("Резервація завершилася. Оновлено доступність.");
      load().catch((e) => setError(errorText(e)));
    }
  }, [seconds, reservation]);
  useEffect(() => {
    setCredit(undefined);
  }, [selected?.id, months, down, paymentType]);
  useEffect(() => {
    if (mine || !cemeteryId) return;
    const t = setInterval(() => {
      newApi
        .plots(cemeteryId)
        .then(setPlots)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [mine, cemeteryId]);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
      await load().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  const active = selected && reservation?.plotId === selected.id && seconds > 0;
  const labels = {
    available: "Вільне",
    reserved: "Зарезервоване",
    sold: "Продане",
  };
  const xs = [...new Set(plots.map((p) => p.positionX))].sort((a, b) => a - b),
    ys = [...new Set(plots.map((p) => p.positionY))].sort((a, b) => a - b);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{mine ? "Мої придбані місця" : "Кладовища та місця"}</h1>
          <p>
            Дані та доступність із сервера. Кредитний розрахунок є
            мок-розрахунком.
          </p>
        </div>
        <Link to={mine ? "/map" : "/plots"} className="button secondary">
          {mine ? "Відкрити карту" : "Мої місця"}
        </Link>
      </div>
      <ErrorView error={error} />
      {message && (
        <div role="status" className="map-empty-info">
          {message}
        </div>
      )}
      {loading ? (
        <div className="loading">Завантаження…</div>
      ) : mine ? (
        <div className="service-grid">
          {owned.length ? (
            owned.map((p) => (
              <section className="panel detail-panel" key={p.id}>
                <h2>{p.cemetery.name}</h2>
                <p>
                  {p.cemetery.city} · місце {p.positionX}:{p.positionY}
                </p>
                <b>{cash(p.price)}</b>
                <p>
                  {p.purchase?.paymentType === "credit"
                    ? `Кредит: ${p.purchase.creditMonths} міс., ${cash(p.purchase.monthlyPayment ?? 0)}/міс.`
                    : "Повна оплата"}
                </p>
              </section>
            ))
          ) : (
            <div className="empty">Ви ще не придбали місць.</div>
          )}
        </div>
      ) : (
        <>
          <section className="panel detail-panel">
            <label>
              Кладовище
              <select
                value={cemeteryId}
                onChange={(e) => setCemeteryId(e.target.value)}
              >
                {cemeteries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.city}
                  </option>
                ))}
              </select>
            </label>
            {!cemeteries.length && <p>Кладовищ поки немає.</p>}
            <div
              className="cemetery-overview"
              role="group"
              aria-label="Маркери кладовищ на координатній карті"
            >
              <svg
                viewBox="0 0 720 260"
                aria-label="Координатна карта кладовищ"
              >
                <rect width="720" height="260" fill="#edf3e6" />
                {cemeteries.map((c, i) => {
                  const minX = Math.min(...cemeteries.map((c) => c.longitude)),
                    maxX = Math.max(...cemeteries.map((c) => c.longitude)),
                    minY = Math.min(...cemeteries.map((c) => c.latitude)),
                    maxY = Math.max(...cemeteries.map((c) => c.latitude));
                  const x =
                      40 + ((c.longitude - minX) / (maxX - minX || 1)) * 620,
                    y = 200 - ((c.latitude - minY) / (maxY - minY || 1)) * 150;
                  return (
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={"Обрати " + c.name}
                      key={c.id}
                      onClick={() => setCemeteryId(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setCemeteryId(c.id);
                        }
                      }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={c.id === cemeteryId ? 10 : 7}
                        fill="#47744b"
                      />
                      <text x={x + 12} y={y + (i % 2 ? 15 : -10)} fontSize="11">
                        {c.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <small>
                Координатна схема маркерів без картографічної підкладки.{" "}
                {cemeteries.find((c) => c.id === cemeteryId)?.latitude},{" "}
                {cemeteries.find((c) => c.id === cemeteryId)?.longitude}
              </small>
            </div>
          </section>
          <div className="detail-grid">
            <section className="panel detail-panel">
              <h2>Схема місць</h2>
              <p>Зелені — вільні, жовті — резерв, червоні — продані.</p>
              {plots.length ? (
                <div className="live-plan">
                  <svg
                    viewBox={`0 0 ${Math.max(240, xs.length * 72 + 30)} ${Math.max(180, ys.length * 60 + 30)}`}
                    aria-label="Схема місць кладовища"
                  >
                    {plots.map((p) => (
                      <g
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Місце ${p.positionX}:${p.positionY}, ${labels[p.status]}`}
                        onClick={() => {
                          setSelected(p);
                          setMessage("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(p);
                          }
                        }}
                      >
                        <rect
                          x={15 + xs.indexOf(p.positionX) * 72}
                          y={15 + ys.indexOf(p.positionY) * 60}
                          width="60"
                          height="42"
                          rx="5"
                          fill={
                            p.status === "available"
                              ? "#c6dbb3"
                              : p.status === "reserved"
                                ? "#edda9b"
                                : "#dbb7ab"
                          }
                          stroke={selected?.id === p.id ? "#234d30" : "#9fa993"}
                          strokeWidth={selected?.id === p.id ? 3 : 1}
                        />
                        <text
                          x={45 + xs.indexOf(p.positionX) * 72}
                          y={40 + ys.indexOf(p.positionY) * 60}
                          textAnchor="middle"
                          fontSize="10"
                        >
                          {p.positionX}:{p.positionY}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="empty">У цьому кладовищі місць поки немає.</div>
              )}
            </section>
            <section className="panel detail-panel">
              {selected ? (
                <>
                  <h2>
                    Місце {selected.positionX}:{selected.positionY}
                  </h2>
                  <p>
                    {
                      labels[
                        plots.find((p) => p.id === selected.id)?.status ??
                          selected.status
                      ]
                    }
                  </p>
                  <h2>{cash(selected.price)}</h2>
                  {!active ? (
                    <button
                      className="button primary"
                      disabled={
                        busy ||
                        reservation !== undefined ||
                        (plots.find((p) => p.id === selected.id)?.status ??
                          selected.status) !== "available"
                      }
                      onClick={() =>
                        act(async () => {
                          setReservation(await newApi.reserve(selected.id));
                          await load();
                        })
                      }
                    >
                      Резервувати на 10 хвилин
                    </button>
                  ) : (
                    <>
                      <p role="timer">
                        Залишилось {Math.floor(seconds / 60)}:
                        {String(seconds % 60).padStart(2, "0")}
                      </p>
                      <button
                        disabled={busy}
                        className="button secondary"
                        onClick={() =>
                          act(async () => {
                            await newApi.release(selected.id);
                            setReservation(undefined);
                            await load();
                          })
                        }
                      >
                        Скасувати резерв
                      </button>
                      <label className="field">
                        Оплата
                        <select
                          value={paymentType}
                          onChange={(e) =>
                            setPayment(
                              e.target.value === "credit" ? "credit" : "full",
                            )
                          }
                        >
                          <option value="full">Повна</option>
                          <option value="credit">Кредит (мок)</option>
                        </select>
                      </label>
                      {paymentType === "credit" && (
                        <>
                          <label className="field">
                            Строк
                            <select
                              value={months}
                              onChange={(e) =>
                                setMonths(Number(e.target.value) as 6 | 12 | 24)
                              }
                            >
                              {[6, 12, 24].map((n) => (
                                <option key={n} value={n}>
                                  {n} міс.
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            Перший внесок
                            <input
                              type="number"
                              min={0}
                              max={selected.price - 1}
                              step={1}
                              value={down}
                              onChange={(e) => setDown(Number(e.target.value))}
                            />
                          </label>
                          <button
                            className="button secondary"
                            disabled={
                              busy ||
                              !Number.isInteger(down) ||
                              down < 0 ||
                              down >= selected.price
                            }
                            onClick={() =>
                              act(async () => {
                                setCredit(
                                  await newApi.credit(
                                    selected.id,
                                    months,
                                    down,
                                  ),
                                );
                              })
                            }
                          >
                            Розрахувати
                          </button>
                          {credit && (
                            <p>
                              {cash(credit.monthlyPayment)}/міс. ·{" "}
                              {credit.annualRate * 100}% річних
                              <br />
                              Разом {cash(credit.totalPaid)}
                              <br />
                              Переплата {cash(credit.overpayment)}
                            </p>
                          )}
                        </>
                      )}
                      <button
                        className="button primary"
                        disabled={
                          busy ||
                          (paymentType === "credit" &&
                            (!credit ||
                              credit.months !== months ||
                              credit.downPayment !== down))
                        }
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Підтвердити купівлю місця за ${cash(selected.price)}? ${paymentType === "credit" ? "Кредитний розрахунок моковий." : ""}`,
                            )
                          )
                            return;
                          act(async () => {
                            await newApi.purchase(
                              selected.id,
                              paymentType === "full"
                                ? { paymentType: "full" }
                                : {
                                    paymentType: "credit",
                                    months,
                                    downPayment: down,
                                  },
                            );
                            setReservation(undefined);
                            setCredit(undefined);
                            setMessage(
                              "Місце придбано. Перегляньте «Мої місця».",
                            );
                            await load();
                          });
                        }}
                      >
                        Підтвердити купівлю
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p>Оберіть місце на схемі.</p>
              )}
              {reservation && !active && (
                <div>
                  <p>
                    У вас уже є резерв іншого місця. Залишилось {seconds} с.
                  </p>
                  <button
                    disabled={busy}
                    onClick={() =>
                      act(async () => {
                        await newApi.release(reservation.plotId);
                        setReservation(undefined);
                        await load();
                      })
                    }
                  >
                    Скасувати поточний резерв
                  </button>
                </div>
              )}
              <small>
                Після перезавантаження сторінки локальний таймер не
                відновлюється: сервер збереже резерв до завершення 10 хвилин.
              </small>
            </section>
          </div>
        </>
      )}
    </>
  );
}
