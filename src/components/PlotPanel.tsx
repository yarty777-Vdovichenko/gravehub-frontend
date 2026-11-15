import { useEffect, useState } from "react";
import { errorText } from "../api";
import type { BurialPlot, Credit, Reservation } from "../new-api";
import { plotsApi } from "../new-api";
import "../new-pages.css";
import { ErrorBox } from "./ErrorBox";
import { money } from "./money";
import { useApp } from "./useApp";

const TERMS = [6, 12, 24] as const;

function useCountdown(until: string | undefined, onExpire: () => void) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!until) return;
    const tick = () => {
      const ms = new Date(until).getTime() - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0) onExpire();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until]);
  return left;
}

export function PlotPanel({
  plot,
  cemeteryName,
  reservation,
  onReservation,
  onChanged,
}: {
  plot: BurialPlot;
  cemeteryName: string;
  reservation: Reservation | null;
  onReservation: (r: Reservation | null) => void;
  onChanged: () => void;
}) {
  const a = useApp(),
    mine = reservation?.plotId === plot.id,
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [payment, setPayment] = useState<"full" | "credit">("full"),
    [months, setMonths] = useState<(typeof TERMS)[number]>(12),
    [down, setDown] = useState(0),
    [credit, setCredit] = useState<Credit | null>(null);
  const left = useCountdown(mine ? reservation?.reservedUntil : undefined, () => {
    onReservation(null);
    onChanged();
    a.notice("Час резервації минув — місце знову вільне.");
  });
  useEffect(() => {
    setError("");
    setCredit(null);
  }, [plot.id]);
  useEffect(() => {
    if (!mine || payment !== "credit") return;
    if (!Number.isInteger(down) || down < 0 || down >= plot.price) {
      setCredit(null);
      setError(
        down >= plot.price ? "Перший внесок має бути меншим за ціну місця." : "",
      );
      return;
    }
    let live = true;
    setError("");
    plotsApi
      .creditPreview(plot.id, months, down)
      .then((c) => live && setCredit(c))
      .catch((e) => live && setError(errorText(e)));
    return () => {
      live = false;
    };
  }, [mine, payment, months, down, plot.id, plot.price]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(errorText(e));
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  const mm = String(Math.floor(left / 60)).padStart(2, "0"),
    ss = String(left % 60).padStart(2, "0");
  return (
    <div className="plot-panel panel">
      <h3>
        Місце {plot.positionX + 1}-{plot.positionY + 1}
      </h3>
      <p className="muted">{cemeteryName}</p>
      <p className="plot-price">{money(plot.price)}</p>
      {error && <ErrorBox text={error} />}
      {plot.status === "sold" && <p>Це місце вже продане.</p>}
      {plot.status === "reserved" && !mine && (
        <p>Місце тимчасово зарезервоване. Якщо резервацію не завершать, воно звільниться за кілька хвилин.</p>
      )}
      {plot.status === "available" && !mine && (
        <>
          <p>Резервація тримає місце за вами 10 хвилин, щоб ви встигли оформити покупку.</p>
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                onReservation(await plotsApi.reserve(plot.id));
                onChanged();
              })
            }
          >
            Зарезервувати
          </button>
        </>
      )}
      {mine && (
        <>
          <p role="timer" className="plot-timer">
            Резервація діє ще {mm}:{ss}
          </p>
          <div className="plot-pay">
            <label className="checkbox">
              <input type="radio" name="pay" checked={payment === "full"} onChange={() => setPayment("full")} />
              Повна оплата
            </label>
            <label className="checkbox">
              <input type="radio" name="pay" checked={payment === "credit"} onChange={() => setPayment("credit")} />
              У кредит
            </label>
          </div>
          {payment === "credit" && (
            <div className="plot-credit">
              <label className="field">
                <span>Строк, місяців</span>
                <select value={months} onChange={(e) => setMonths(Number(e.target.value) as (typeof TERMS)[number])}>
                  {TERMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Перший внесок, ₴</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={down}
                  onChange={(e) => setDown(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                />
              </label>
              {credit && (
                <ul className="credit-summary">
                  <li>Щомісячний платіж: <b>{money(credit.monthlyPayment)}</b></li>
                  <li>Ставка: {Math.round(credit.annualRate * 100)}% річних</li>
                  <li>Разом сплатите: {money(credit.totalPaid)}</li>
                  <li>Переплата: {money(credit.overpayment)}</li>
                </ul>
              )}
            </div>
          )}
          <div className="plot-actions">
            <button
              className="button primary"
              disabled={busy || (payment === "credit" && !credit)}
              onClick={() =>
                run(async () => {
                  await plotsApi.purchase(
                    plot.id,
                    payment === "full"
                      ? { paymentType: "full" }
                      : { paymentType: "credit", months, downPayment: down },
                  );
                  onReservation(null);
                  onChanged();
                  a.notice("Місце придбано. Дякуємо!");
                })
              }
            >
              Купити
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await plotsApi.release(plot.id);
                  onReservation(null);
                  onChanged();
                })
              }
            >
              Скасувати резервацію
            </button>
          </div>
        </>
      )}
    </div>
  );
}
