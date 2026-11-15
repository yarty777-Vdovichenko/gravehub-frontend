import type { OwnedPlot } from "../new-api";
import "../new-pages.css";
import { money } from "./money";

export function MyPlots({ plots }: { plots: OwnedPlot[] }) {
  return (
    <section className="panel my-plots">
      <div className="panel-title"><h2>Мої місця</h2></div>
      {plots.length ? (
        <ul>
          {plots.map((p) => (
            <li key={p.id}>
              <b>{p.cemetery.name}</b>, {p.cemetery.city} · місце {p.positionX + 1}-{p.positionY + 1}
              <small>
                {money(p.price)} ·{" "}
                {p.purchase?.paymentType === "credit"
                  ? `кредит ${p.purchase.creditMonths} міс., ${money(p.purchase.monthlyPayment ?? 0)}/міс.`
                  : "повна оплата"}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted pad">Ви ще не придбали жодного місця.</p>
      )}
    </section>
  );
}
