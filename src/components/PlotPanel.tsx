import { useCallback, useEffect, useState } from "react";
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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [until, onExpire]);
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
  onReservation: (reservation: Reservation | null) => void;
  onChanged: () => void;
}) {
  const { notice } = useApp();
  const mine = reservation?.plotId === plot.id;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<"full" | "credit">("full");
  const [months, setMonths] = useState<(typeof TERMS)[number]>(12);
  const [downPayment, setDownPayment] = useState(0);
  const [credit, setCredit] = useState<Credit | null>(null);
  const [mockPaymentOpen, setMockPaymentOpen] = useState(false);

  const handleExpired = useCallback(() => {
    onReservation(null);
    onChanged();
    notice("Час резервації минув — місце знову вільне.");
  }, [notice, onChanged, onReservation]);
  const left = useCountdown(
    mine ? reservation?.reservedUntil : undefined,
    handleExpired,
  );

  useEffect(() => {
    setError("");
    setCredit(null);
  }, [plot.id]);

  useEffect(() => {
    if (!mine || payment !== "credit") return;
    setCredit(null);
    if (
      !Number.isInteger(downPayment) ||
      downPayment < 0 ||
      downPayment >= plot.price
    ) {
      setCredit(null);
      setError(
        downPayment >= plot.price
          ? "Перший внесок має бути меншим за ціну місця."
          : "",
      );
      return;
    }
    let active = true;
    setError("");
    plotsApi
      .creditPreview(plot.id, months, downPayment)
      .then((preview) => active && setCredit(preview))
      .catch((e: unknown) => active && setError(errorText(e)));
    return () => {
      active = false;
    };
  }, [mine, payment, months, downPayment, plot.id, plot.price]);

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

  const minutes = String(Math.floor(left / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");

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
        <p>
          Місце тимчасово зарезервоване. Якщо резервацію не завершать, воно
          звільниться за кілька хвилин.
        </p>
      )}
      {plot.status === "available" && !mine && (
        <>
          <p>
            Резервація тримає місце за вами 10 хвилин, щоб ви встигли оформити покупку.
          </p>
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
            Зарезервувати для покупки
          </button>
        </>
      )}
      {mine && (
        <>
          <p role="timer" className="plot-timer">
            Резервація діє ще {minutes}:{seconds}
          </p>
          <div className="plot-pay">
            <label className="checkbox">
              <input
                type="radio"
                name="pay"
                checked={payment === "full"}
                onChange={() => setPayment("full")}
              />
              Повна оплата
            </label>
            <label className="checkbox">
              <input
                type="radio"
                name="pay"
                checked={payment === "credit"}
                onChange={() => setPayment("credit")}
              />
              У кредит
            </label>
          </div>
          {payment === "credit" && (
            <div className="plot-credit">
              <label className="field">
                <span>Строк, місяців</span>
                <select
                  value={months}
                  onChange={(event) =>
                    setMonths(Number(event.target.value) as (typeof TERMS)[number])
                  }
                >
                  {TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Перший внесок, ₴</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={downPayment}
                  onChange={(event) =>
                    setDownPayment(
                      Math.max(0, Math.floor(Number(event.target.value) || 0)),
                    )
                  }
                />
              </label>
              {credit && (
                <ul className="credit-summary">
                  <li>
                    Щомісячний платіж: <b>{money(credit.monthlyPayment)}</b>
                  </li>
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
              onClick={() => setMockPaymentOpen(true)}
            >
              Оплатити й купити
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
      {mockPaymentOpen && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !busy) setMockPaymentOpen(false);
          }}
        >
          <section className="panel modal" role="dialog" aria-modal="true" aria-label="Оплата могили">
            <button
              type="button"
              className="close"
              aria-label="Закрити оплату"
              disabled={busy}
              onClick={() => setMockPaymentOpen(false)}
            >
              ×
            </button>
            <h2>Мокова оплата могили</h2>
            <p>Без списання коштів. Тестова картка підтверджує покупку автоматично.</p>
            <label className="field">
              <span>Номер картки</span>
              <input value="4242 4242 4242 4242" readOnly />
            </label>
            <strong>{money(payment === "credit" ? downPayment : plot.price)}</strong>
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                disabled={busy}
                onClick={() => setMockPaymentOpen(false)}
              >
                Скасувати
              </button>
              <button
                className="button primary"
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await plotsApi.purchase(
                      plot.id,
                      payment === "full"
                        ? { paymentType: "full" }
                        : { paymentType: "credit", months, downPayment },
                    );
                    setMockPaymentOpen(false);
                    onReservation(null);
                    onChanged();
                    notice("Мокову оплату підтверджено. Місце придбано.");
                  })
                }
              >
                {busy ? "Оплата…" : "Підтвердити оплату"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
