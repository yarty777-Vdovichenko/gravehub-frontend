import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorText } from "../api";
import type { BurialPlot, Cemetery, OwnedPlot, Reservation } from "../new-api";
import { newApi } from "../new-api";
import "../new-pages.css";
import { CemeteryMap } from "./CemeteryMap";
import { ErrorBox } from "./ErrorBox";
import { MyPlots } from "./MyPlots";
import { PlotGrid } from "./PlotGrid";
import { PlotPanel } from "./PlotPanel";
import { useApp } from "./useApp";

export function MapPage() {
  const { demo } = useApp();
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [cemeteryId, setCemeteryId] = useState("");
  const [plots, setPlots] = useState<BurialPlot[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loadingCemeteries, setLoadingCemeteries] = useState(true);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (demo) {
      setLoadingCemeteries(false);
      return;
    }
    let active = true;
    newApi
      .cemeteries()
      .then((items) => {
        if (!active) return;
        setCemeteries(items);
        setCemeteryId(items[0]?.id ?? "");
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoadingCemeteries(false);
      });
    return () => {
      active = false;
    };
  }, [demo]);

  const loadPlots = useCallback(async (signal?: AbortSignal) => {
    if (!cemeteryId) {
      setPlots([]);
      return;
    }
    const items = await newApi.plots(cemeteryId, signal);
    setPlots(items);
    setSelectedId((id) => (items.some((item) => item.id === id) ? id : ""));
  }, [cemeteryId]);

  useEffect(() => {
    if (demo || !cemeteryId) {
      setPlots([]);
      setLoadingPlots(false);
      return;
    }
    const controller = new AbortController();
    setLoadingPlots(true);
    setError("");
    loadPlots(controller.signal)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(errorText(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingPlots(false);
      });
    return () => controller.abort();
  }, [cemeteryId, demo, loadPlots]);

  const refreshPlots = useCallback(async () => {
    try {
      await loadPlots();
    } catch (e) {
      setError(errorText(e));
    }
  }, [loadPlots]);

  const selectedPlot = plots.find((plot) => plot.id === selectedId);
  const cemeteryName = cemeteries.find((item) => item.id === cemeteryId)?.name ?? "";

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Карта кладовищ і місць</h1>
          <p>Оберіть вільне місце, щоб переглянути умови й оформити покупку.</p>
        </div>
        <Link className="button secondary" to="/plots">Мої придбані місця</Link>
      </header>
      {demo && (
        <ErrorBox text="Карта та купівля місць доступні після підключення до сервера." />
      )}
      {error && <ErrorBox text={error} />}
      {!demo && loadingCemeteries ? (
        <p role="status">Завантаження кладовищ…</p>
      ) : !demo ? (
        <>
          <section className="panel detail-panel">
            <label className="field">
              <span>Кладовище</span>
              <select
                aria-label="Кладовище"
                value={cemeteryId}
                onChange={(event) => {
                  setCemeteryId(event.target.value);
                  setSelectedId("");
                  setReservation(null);
                }}
              >
                {cemeteries.map((cemetery) => (
                  <option key={cemetery.id} value={cemetery.id}>
                    {cemetery.name} · {cemetery.city}
                  </option>
                ))}
              </select>
            </label>
            <CemeteryMap
              cemeteries={cemeteries}
              selectedId={cemeteryId}
              onSelect={(id) => {
                setCemeteryId(id);
                setSelectedId("");
                setReservation(null);
              }}
            />
            {!cemeteries.length && !error && (
              <p className="muted">Кладовища поки не додані.</p>
            )}
          </section>
          <div className="detail-grid">
            <section className="panel detail-panel">
              <h2>Схема місць</h2>
              <p>Оберіть вільне місце для перегляду ціни та оформлення покупки.</p>
              {loadingPlots ? (
                <p role="status">Завантаження місць…</p>
              ) : (
                <PlotGrid
                  plots={plots}
                  selectedId={selectedId}
                  onSelect={(plot) => setSelectedId(plot.id)}
                />
              )}
            </section>
            {selectedPlot && (
              <PlotPanel
                plot={selectedPlot}
                cemeteryName={cemeteryName}
                reservation={reservation}
                onReservation={setReservation}
                onChanged={refreshPlots}
              />
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

export function MyPlotsPage() {
  const { demo } = useApp();
  const [plots, setPlots] = useState<OwnedPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (demo) {
      setLoading(false);
      return;
    }
    let active = true;
    newApi
      .mine()
      .then((items) => {
        if (active) setPlots(items);
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demo]);

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Мої придбані місця</h1>
          <p>Ваші покупки та умови оплати.</p>
        </div>
        <Link className="button secondary" to="/map">Відкрити карту</Link>
      </header>
      {demo && (
        <ErrorBox text="Список придбаних місць доступний після підключення до сервера." />
      )}
      {error && <ErrorBox text={error} />}
      {loading ? <p role="status">Завантаження місць…</p> : !demo && <MyPlots plots={plots} />}
    </>
  );
}
