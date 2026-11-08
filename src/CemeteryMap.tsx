import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Plus,
  Minus,
  RotateCcw,
  Search,
  ArrowRight,
  Leaf,
  Navigation,
  Check,
  X,
  Flower2,
} from "lucide-react";
import {
  cemetery,
  initialPlots,
  filterPlots,
  reserveDemoPlot,
  plotLabels,
} from "./cemetery-data";
import type { Plot } from "./cemetery-data";
import "./cemetery.css";
// Only demonstrational inventory, shared across route remounts in this tab. No real reservations.
let inventory = [...initialPlots];
export function CemeteryMap({
  demo,
  customer,
}: {
  demo: boolean;
  customer: boolean;
}) {
  const [plots, setPlots] = useState(inventory),
    [selectedId, setSelectedId] = useState<string>(),
    [sector, setSector] = useState(""),
    [status, setStatus] = useState(""),
    [query, setQuery] = useState(""),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [confirmation, setConfirmation] = useState(false),
    [message, setMessage] = useState("");
  const drag = useRef<{
      x: number;
      y: number;
      panX: number;
      panY: number;
      moved: boolean;
    } | null>(null),
    suppressClick = useRef(false);
  const visible = filterPlots(plots, sector, status, query),
    selected = plots.find((p) => p.id === selectedId);
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const select = (p: Plot) => {
    setSelectedId(p.id);
    setConfirmation(false);
    setMessage("");
  };
  const formatPrice = (n: number) =>
    new Intl.NumberFormat("uk-UA").format(n) + " ₴";
  const changeFilter = (fn: () => void) => {
    fn();
    setSelectedId(undefined);
    setConfirmation(false);
    setMessage("");
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">МІСЦЕ ДЛЯ ПАМ’ЯТІ</span>
          <h1>Карта кладовища</h1>
          <p>Дослідіть територію та оберіть ділянку на інтерактивному плані.</p>
        </div>
        <span className="map-demo-label">
          <Leaf size={15} /> Навчальна демонстрація
        </span>
      </div>
      <div className="map-notice">
        <MapPin size={18} />
        <p>
          Це схема вигаданого кладовища. Ділянки, ціни й координати
          демонстраційні. Вибір та демобронювання не створюють реального
          бронювання й скидаються після оновлення сторінки.
        </p>
      </div>
      <section className="panel map-filter-bar">
        <label className="field">
          <span>Кладовище</span>
          <select aria-label="Кладовище" value="demo" onChange={() => {}}>
            <option value="demo">Меморіальний сад · демо</option>
          </select>
        </label>
        <label className="field">
          <span>Сектор</span>
          <select
            aria-label="Сектор"
            value={sector}
            onChange={(e) => changeFilter(() => setSector(e.target.value))}
          >
            <option value="">Усі сектори</option>
            {["A", "B", "C", "D"].map((s) => (
              <option key={s} value={s}>
                Сектор {s}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Доступність</span>
          <select
            aria-label="Доступність"
            value={status}
            onChange={(e) => changeFilter(() => setStatus(e.target.value))}
          >
            <option value="">Усі місця</option>
            <option value="free">Вільні</option>
            <option value="reserved">Заброньовані</option>
            <option value="occupied">Зайняті</option>
          </select>
        </label>
        <label className="field">
          <span>Номер ділянки</span>
          <div className="map-search">
            <Search size={16} />
            <input
              aria-label="Номер ділянки"
              placeholder="Наприклад, A-02"
              value={query}
              onChange={(e) => changeFilter(() => setQuery(e.target.value))}
            />
          </div>
        </label>
      </section>
      <div className="cemetery-layout">
        <section className="panel map-panel">
          <div className="map-panel-title">
            <div>
              <h2>{cemetery.name}</h2>
              <p>
                <MapPin size={12} />
                {cemetery.region} · схематичний план
              </p>
            </div>
            <span>
              {visible.length} із {plots.length} ділянок
            </span>
          </div>
          <div className="map-viewport">
            <svg
              viewBox="0 0 860 620"
              aria-label="Інтерактивний план кладовища"
              className="cemetery-svg"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                drag.current = {
                  x: e.clientX,
                  y: e.clientY,
                  panX: pan.x,
                  panY: pan.y,
                  moved: false,
                };
                suppressClick.current = false;
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                const dx =
                    ((e.clientX - d.x) * 860) /
                    e.currentTarget.getBoundingClientRect().width,
                  dy =
                    ((e.clientY - d.y) * 620) /
                    e.currentTarget.getBoundingClientRect().height;
                if (Math.abs(dx) + Math.abs(dy) > 5) {
                  d.moved = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
                if (d.moved)
                  setPan({
                    x: Math.max(-550, Math.min(550, d.panX + dx)),
                    y: Math.max(-400, Math.min(400, d.panY + dy)),
                  });
              }}
              onPointerUp={(e) => {
                suppressClick.current = drag.current?.moved ?? false;
                drag.current = null;
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <defs>
                <pattern
                  id="map-grain"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="6" cy="6" r=".8" fill="#d8e0ce" />
                </pattern>
              </defs>
              <rect width="860" height="620" fill="#f0f3e8" />
              <rect width="860" height="620" fill="url(#map-grain)" />
              <g
                transform={`translate(${pan.x} ${pan.y}) translate(430 310) scale(${zoom}) translate(-430 -310)`}
              >
                <rect
                  x="65"
                  y="45"
                  width="720"
                  height="500"
                  rx="40"
                  fill="#e8eedc"
                  stroke="#d5dfc7"
                  strokeWidth="3"
                />
                <path
                  d="M430 50V565 M70 287H785"
                  stroke="#fdfbf4"
                  strokeWidth="43"
                />
                <path
                  d="M430 50V565 M70 287H785"
                  stroke="#deded0"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                />
                <path
                  d="M90 220H375 M480 220H765 M90 460H375 M480 460H765"
                  stroke="#fdfbf4"
                  strokeWidth="17"
                />
                {["A", "B", "C", "D"].map((s, i) => (
                  <text
                    key={s}
                    x={112 + (i % 2) * 390}
                    y={78 + Math.floor(i / 2) * 240}
                    className="sector-label"
                  >
                    СЕКТОР {s}
                  </text>
                ))}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <g
                    key={i}
                    transform={`translate(${i < 6 ? 82 : 780} ${88 + (i % 6) * 78})`}
                  >
                    <circle r="15" fill="#c9d8b6" />
                    <circle cx="-4" cy="-5" r="11" fill="#d3dfc2" />
                    <circle cx="4" cy="3" r="9" fill="#bdcfa7" />
                  </g>
                ))}
                <circle
                  cx="430"
                  cy="287"
                  r="32"
                  fill="#d3dfbe"
                  stroke="#fdfbf4"
                  strokeWidth="7"
                />
                <path d="M420 287q10-28 20 0q-10 20-20 0" fill="#98b47e" />
                <text
                  x="430"
                  y="528"
                  textAnchor="middle"
                  className="path-label"
                >
                  ГОЛОВНА АЛЕЯ
                </text>
                <rect
                  x="392"
                  y="556"
                  width="76"
                  height="24"
                  rx="5"
                  fill="#476d4d"
                />
                <text
                  x="430"
                  y="572"
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                >
                  ВХІД
                </text>
                {plots.map((p) => {
                  const shown = visible.some((v) => v.id === p.id);
                  return (
                    <g
                      key={p.id}
                      className={`map-plot ${p.status} ${selectedId === p.id ? "selected" : ""} ${shown ? "" : "dimmed"}`}
                      role="button"
                      tabIndex={shown ? 0 : -1}
                      aria-label={`Ділянка ${p.number}, ${plotLabels[p.status]}, ${p.area} м²`}
                      aria-pressed={selectedId === p.id}
                      aria-hidden={!shown}
                      onClick={() => {
                        if (shown && !suppressClick.current) select(p);
                      }}
                      onKeyDown={(e) => {
                        if (shown && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          select(p);
                        }
                      }}
                    >
                      <title>
                        {p.number} · {plotLabels[p.status]}
                      </title>
                      <rect
                        x={p.x}
                        y={p.y}
                        width={p.width}
                        height={p.height}
                        rx="5"
                      />
                      <text
                        x={p.x + p.width / 2}
                        y={p.y + 20}
                        textAnchor="middle"
                      >
                        {p.number}
                      </text>
                      {selectedId === p.id && (
                        <circle
                          cx={p.x + p.width - 2}
                          cy={p.y + 2}
                          r="5"
                          fill="#284d38"
                          stroke="white"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            <div className="map-compass">
              <Navigation size={18} />
              <span>Пн</span>
            </div>
            <div className="map-controls">
              <button
                aria-label="Збільшити карту"
                disabled={zoom >= 2.5}
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              >
                <Plus size={18} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                aria-label="Зменшити карту"
                disabled={zoom <= 0.75}
                onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              >
                <Minus size={18} />
              </button>
              <button aria-label="Скинути масштаб і положення" onClick={reset}>
                <RotateCcw size={16} />
              </button>
            </div>
            <span className="map-pan-hint">
              Перетягніть план, щоб перемістити
            </span>
          </div>
          <div className="map-legend">
            {(["free", "reserved", "occupied"] as const).map((s) => (
              <span key={s}>
                <i className={s} />
                {plotLabels[s]}{" "}
                <b>{plots.filter((p) => p.status === s).length}</b>
              </span>
            ))}
          </div>
        </section>
        <aside className="panel plot-detail" aria-live="polite">
          {selected ? (
            <>
              <div className="plot-detail-heading">
                <span className="tiny-icon">
                  <MapPin size={20} />
                </span>
                <button
                  aria-label="Закрити деталі ділянки"
                  onClick={() => {
                    setSelectedId(undefined);
                    setConfirmation(false);
                  }}
                >
                  <X size={17} />
                </button>
              </div>
              <span className={"plot-status " + selected.status}>
                {plotLabels[selected.status]}
              </span>
              <h2>Ділянка {selected.number}</h2>
              <p>
                Сектор {selected.sector} · {cemetery.name}
              </p>
              <div className="plot-price">
                {formatPrice(selected.price)}
                <span>демонстраційна ціна місця</span>
              </div>
              <dl>
                <div>
                  <dt>Площа</dt>
                  <dd>{selected.area} м²</dd>
                </div>
                <div>
                  <dt>Тип</dt>
                  <dd>{selected.area === 6 ? "Сімейне" : "Одиночне"}</dd>
                </div>
                <div>
                  <dt>Регіон</dt>
                  <dd>{cemetery.region}</dd>
                </div>
              </dl>
              <p className="plot-description">{selected.description}</p>
              {selected.status === "free" ? (
                <>
                  <button
                    className="button primary"
                    disabled={!customer || !demo}
                    onClick={() => setConfirmation(true)}
                  >
                    Обрати місце <ArrowRight size={16} />
                  </button>
                  {(!demo || !customer) && (
                    <p className="plot-hint">
                      {!customer
                        ? "Для вибору перейдіть у режим замовника."
                        : "Вибір доступний лише у деморежимі до підключення API ділянок."}
                    </p>
                  )}
                </>
              ) : (
                <p className="plot-unavailable">
                  {selected.status === "reserved"
                    ? "Це місце вже заброньоване."
                    : "Це місце зайняте."}{" "}
                  Оберіть вільну ділянку на плані.
                </p>
              )}
              {message && (
                <div role="status" className="map-success">
                  <Check size={18} />
                  {message}
                </div>
              )}
              {demo && customer && (selected.status === "free" || message) && (
                <Link
                  className="button secondary"
                  to="/contracts/new"
                  state={{
                    plotSelection: {
                      id: selected.id,
                      number: selected.number,
                      cemetery: cemetery.name,
                      positionX: selected.positionX,
                      positionY: selected.positionY,
                      regionName: cemetery.region,
                    },
                  }}
                >
                  Замовити догляд тут <Flower2 size={16} />
                </Link>
              )}
              <small>
                Догляд — окреме замовлення послуги, а не оплата чи бронювання
                місця.
              </small>
            </>
          ) : (
            <div className="plot-placeholder">
              <div className="plot-placeholder-icon">
                <MapPin size={34} />
              </div>
              <h2>Знайдіть своє місце</h2>
              <p>
                Натисніть на ділянку на плані або в списку нижче, щоб
                переглянути її характеристики.
              </p>
              <div>
                <span>01</span> Оберіть сектор
              </div>
              <div>
                <span>02</span> Перегляньте вільні місця
              </div>
              <div>
                <span>03</span> Відкрийте деталі ділянки
              </div>
            </div>
          )}
        </aside>
      </div>
      <section className="panel plot-list">
        <div className="panel-title">
          <h2>
            Ділянки на плані <span>{visible.length}</span>
          </h2>
          <span>Доступні також із клавіатури</span>
        </div>
        {visible.length ? (
          <div className="plot-list-grid">
            {visible.map((p) => (
              <button
                key={p.id}
                aria-pressed={selectedId === p.id}
                className={
                  "plot-list-item " + (selectedId === p.id ? "active" : "")
                }
                onClick={() => select(p)}
              >
                <span>
                  <b>{p.number}</b>
                  <small>
                    {p.area} м² · {formatPrice(p.price)}
                  </small>
                </span>
                <span className={"plot-status " + p.status}>
                  {plotLabels[p.status]}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Search />
            <h3>Ділянок за цими умовами немає</h3>
            <p>Змініть сектор, статус або номер ділянки.</p>
            <button
              className="button secondary"
              onClick={() => {
                setSector("");
                setStatus("");
                setQuery("");
              }}
            >
              Скинути фільтри
            </button>
          </div>
        )}
      </section>
      {confirmation && selected && (
        <div className="modal-backdrop">
          <section
            className="panel modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <button
              autoFocus
              className="close"
              aria-label="Закрити підтвердження"
              onClick={() => setConfirmation(false)}
            >
              <X />
            </button>
            <span className="eyebrow">ЛИШЕ ДЕМОНСТРАЦІЯ</span>
            <h2 id="booking-title">Обрати ділянку {selected.number}?</h2>
            <p>
              Демо змінить статус місця на «Заброньоване» до оновлення сторінки.
              Реального бронювання, оплати чи звернення до адміністрації не
              буде.
            </p>
            <div className="form-actions">
              <button
                className="button secondary"
                onClick={() => setConfirmation(false)}
              >
                Повернутися
              </button>
              <button
                className="button primary"
                onClick={() => {
                  if (!demo || !customer || selected.status !== "free") return;
                  const next = reserveDemoPlot(plots, selected.id);
                  inventory = next;
                  setPlots(next);
                  setConfirmation(false);
                  setMessage(
                    "Демобронювання створено. Реальне місце не заброньовано.",
                  );
                }}
              >
                Підтвердити демобронювання
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
