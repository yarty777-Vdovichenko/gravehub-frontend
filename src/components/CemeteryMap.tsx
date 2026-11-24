import { useMemo } from "react";
import type { Cemetery } from "../new-api";
import "../new-pages.css";
import { MAP_VIEW, layoutCemeteryMap } from "./cemeteryMapLayout";

export function CemeteryMap({
  cemeteries,
  selectedId,
  onSelect,
}: {
  cemeteries: Cemetery[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { pins, labels } = useMemo(
    () => layoutCemeteryMap(cemeteries, selectedId),
    [cemeteries, selectedId],
  );
  // Вибраний маркер малюємо останнім, щоб він був поверх інших.
  const ordered = [...pins].sort(
    (a, b) =>
      Number(a.cemetery.id === selectedId) - Number(b.cemetery.id === selectedId),
  );

  return (
    <div className="cemetery-overview">
      <svg
        viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
        role="group"
        aria-label="Карта України з розташуванням кладовищ"
      >
        <title>Карта України</title>
        <image
          href="/ukraine-map.svg"
          x="0"
          y="0"
          width={MAP_VIEW.width}
          height={MAP_VIEW.height}
          aria-hidden="true"
        />
        {labels.map(
          (label) =>
            label.leader && (
              <line
                key={`${label.key}-leader`}
                className="cemetery-pin-leader"
                {...label.leader}
              />
            ),
        )}
        {labels.map((label) => (
          <text
            key={label.key}
            className="cemetery-pin-label"
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            aria-hidden="true"
          >
            {label.text}
          </text>
        ))}
        {ordered.map(({ cemetery, x, y, px, py, moved }) => {
          const selected = cemetery.id === selectedId;
          return (
            <g
              key={cemetery.id}
              className={selected ? "cemetery-pin selected" : "cemetery-pin"}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${cemetery.name}, ${cemetery.city}`}
              onClick={() => onSelect(cemetery.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(cemetery.id);
                }
              }}
            >
              <title>{`${cemetery.name}, ${cemetery.city}`}</title>
              {moved && (
                <line
                  className="cemetery-pin-leader"
                  x1={x}
                  y1={y}
                  x2={px}
                  y2={py}
                />
              )}
              <circle
                className="cemetery-pin-halo"
                cx={px}
                cy={py}
                r={selected ? 10 : 7.5}
              />
              <circle
                className="cemetery-pin-dot"
                cx={px}
                cy={py}
                r={selected ? 5.5 : 4}
              />
            </g>
          );
        })}
      </svg>
      <small>
        Межі карти: © OpenStreetMap contributors / geoBoundaries (ODbL 1.0).
      </small>
    </div>
  );
}
