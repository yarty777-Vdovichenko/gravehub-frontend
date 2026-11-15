import type { BurialPlot } from "../new-api";
import "../new-pages.css";
import { money } from "./money";

const LABEL = { available: "Вільне", reserved: "Зарезервоване", sold: "Продане" };

export function PlotGrid({
  plots,
  selectedId,
  onSelect,
}: {
  plots: BurialPlot[];
  selectedId: string;
  onSelect: (p: BurialPlot) => void;
}) {
  if (!plots.length) return <p>На цьому кладовищі ще немає місць.</p>;
  const cols = Math.max(...plots.map((p) => p.positionX)) + 1;
  const byPos = new Map(plots.map((p) => [`${p.positionX}:${p.positionY}`, p]));
  const rows = Math.max(...plots.map((p) => p.positionY)) + 1;
  const cells = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const p = byPos.get(`${x}:${y}`);
      cells.push(
        p ? (
          <button
            key={p.id}
            type="button"
            className={`plot-cell ${p.status}${p.id === selectedId ? " picked" : ""}`}
            disabled={p.status === "sold"}
            aria-pressed={p.id === selectedId}
            aria-label={`Місце ${x + 1}-${y + 1}: ${LABEL[p.status]}, ${money(p.price)}`}
            title={`${LABEL[p.status]} · ${money(p.price)}`}
            onClick={() => onSelect(p)}
          >
            {x + 1}-{y + 1}
          </button>
        ) : (
          <span key={`${x}:${y}`} className="plot-cell empty" />
        ),
      );
    }
  return (
    <>
      <div className="plot-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(38px, 1fr))` }}>
        {cells}
      </div>
      <div className="plot-legend">
        <span><i className="available" /> Вільне</span>
        <span><i className="reserved" /> Зарезервоване</span>
        <span><i className="sold" /> Продане</span>
      </div>
    </>
  );
}
