import type { Cemetery } from "../new-api";
import "../new-pages.css";
import { CITIES, MAP_H, MAP_W, outlinePath, project } from "./ukraine";

export function CemeteryMap({
  cemeteries,
  selectedId,
  onSelect,
}: {
  cemeteries: Cemetery[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="ukraine-map">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        role="group"
        aria-label="Схематична карта України з кладовищами"
      >
        <path className="ua-land" d={outlinePath()} />
        {CITIES.map((c) => {
          const { x, y } = project(c.lon, c.lat);
          return (
            <g key={c.name} className="ua-city">
              <circle cx={x} cy={y} r={3} />
              <text x={x + 6} y={y + 4}>
                {c.name}
              </text>
            </g>
          );
        })}
        {cemeteries.map((c) => {
          const { x, y } = project(c.longitude, c.latitude);
          const on = c.id === selectedId;
          return (
            <g
              key={c.id}
              className={on ? "ua-pin selected" : "ua-pin"}
              tabIndex={0}
              role="button"
              aria-pressed={on}
              aria-label={`${c.name}, ${c.city}`}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(c.id);
                }
              }}
            >
              <title>{`${c.name}, ${c.city}`}</title>
              <circle className="ua-pin-halo" cx={x} cy={y} r={on ? 15 : 11} />
              <circle className="ua-pin-dot" cx={x} cy={y} r={on ? 7 : 5.5} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
