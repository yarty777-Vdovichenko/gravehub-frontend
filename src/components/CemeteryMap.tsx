import type { Cemetery } from "../new-api";
import "../new-pages.css";

const BOUNDS = { west: 22.1, east: 40.2, south: 44.2, north: 52.4 };

function mapPoint(longitude: number, latitude: number) {
  return {
    x: 160 + ((longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 400,
    y: 10 + ((BOUNDS.north - latitude) / (BOUNDS.north - BOUNDS.south)) * 280,
  };
}

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
    <div className="cemetery-overview">
      <svg
        viewBox="0 0 720 320"
        role="group"
        aria-label="Карта України з розташуванням кладовищ"
      >
        <title>Карта України</title>
        <image
          href="/ukraine-map.svg"
          x="0"
          y="0"
          width="720"
          height="320"
          aria-hidden="true"
        />
        {cemeteries.map((cemetery, index) => {
          const { x, y } = mapPoint(cemetery.longitude, cemetery.latitude);
          const selected = cemetery.id === selectedId;
          return (
            <g
              key={cemetery.id}
              className="cemetery-pin"
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
              <circle
                className="cemetery-pin-halo"
                cx={x}
                cy={y}
                r={selected ? 12 : 9}
              />
              <circle
                className="cemetery-pin-dot"
                cx={x}
                cy={y}
                r={selected ? 6 : 4.5}
              />
              <text
                className="cemetery-pin-label"
                x={x + 10}
                y={y + (index % 2 ? 14 : -8)}
              >
                {cemetery.name}
              </text>
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
