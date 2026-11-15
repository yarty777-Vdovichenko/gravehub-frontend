import { useCallback, useEffect, useState } from "react";
import { errorText } from "../api";
import type { BurialPlot, Cemetery, OwnedPlot, Reservation } from "../new-api";
import { plotsApi } from "../new-api";
import "../new-pages.css";
import { CemeteryMap } from "./CemeteryMap";
import { ErrorBox } from "./ErrorBox";
import { MyPlots } from "./MyPlots";
import { PageTitle } from "./PageTitle";
import { PlotGrid } from "./PlotGrid";
import { PlotPanel } from "./PlotPanel";
import { Spinner } from "./Spinner";
import { useApp } from "./useApp";

export function MapPage() {
  const a = useApp(),
    [cemeteries, setCemeteries] = useState<Cemetery[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [cemeteryId, setCemeteryId] = useState(""),
    [plots, setPlots] = useState<BurialPlot[]>([]),
    [plotsLoading, setPlotsLoading] = useState(false),
    [plotId, setPlotId] = useState(""),
    [reservation, setReservation] = useState<Reservation | null>(null),
    [mine, setMine] = useState<OwnedPlot[]>([]),
    [tick, setTick] = useState(0);
  useEffect(() => {
    if (a.demo) {
      setLoading(false);
      return;
    }
    let live = true;
    plotsApi
      .cemeteries()
      .then((c) => {
        if (!live) return;
        setCemeteries(c);
        if (c[0]) setCemeteryId(c[0].id);
      })
      .catch((e) => live && setError(errorText(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [a.demo]);
  useEffect(() => {
    if (!cemeteryId) return;
    let live = true;
    setPlotsLoading(true);
    Promise.all([plotsApi.plots(cemeteryId), plotsApi.mine()])
      .then(([p, m]) => {
        if (!live) return;
        setPlots(p);
        setMine(m);
      })
      .catch((e) => live && setError(errorText(e)))
      .finally(() => live && setPlotsLoading(false));
    return () => {
      live = false;
    };
  }, [cemeteryId, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  if (a.demo) return <p>Демонстраційна карта вимкнена.</p>;
  const cemetery = cemeteries.find((c) => c.id === cemeteryId),
    plot = plots.find((p) => p.id === plotId);
  return (
    <>
      <PageTitle
        title="Карта кладовищ"
        subtitle="Оберіть кладовище на карті України, а потім вільне місце."
      />
      {error && <ErrorBox text={error} retry={() => { setError(""); reload(); }} />}
      {loading ? (
        <Spinner />
      ) : (
        <div className="map-layout">
          <section className="panel map-panel">
            <CemeteryMap
              cemeteries={cemeteries}
              selectedId={cemeteryId}
              onSelect={(id) => {
                setCemeteryId(id);
                setPlotId("");
              }}
            />
            <ul className="cemetery-list">
              {cemeteries.map((c) => (
                <li key={c.id}>
                  <button
                    className={c.id === cemeteryId ? "selected" : ""}
                    onClick={() => {
                      setCemeteryId(c.id);
                      setPlotId("");
                    }}
                  >
                    <b>{c.name}</b>
                    <small>{c.city}</small>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel plots-panel">
            {cemetery && (
              <h2>
                {cemetery.name}, {cemetery.city}
              </h2>
            )}
            {plotsLoading ? (
              <Spinner />
            ) : (
              <PlotGrid plots={plots} selectedId={plotId} onSelect={(p) => setPlotId(p.id)} />
            )}
            {plot && cemetery && (
              <PlotPanel
                plot={plot}
                cemeteryName={cemetery.name}
                reservation={reservation}
                onReservation={setReservation}
                onChanged={reload}
              />
            )}
          </section>
        </div>
      )}
      <MyPlots plots={mine} />
    </>
  );
}
