export type PlotStatus = "free" | "reserved" | "occupied";
export interface Plot {
  id: string;
  number: string;
  sector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: PlotStatus;
  area: number;
  price: number;
  description: string;
  positionX: number;
  positionY: number;
}
export const cemetery = {
  name: "Меморіальний сад",
  region: "Львівська область",
  description: "Навчальний план вигаданого кладовища",
};
export const plotLabels: Record<PlotStatus, string> = {
  free: "Вільне",
  reserved: "Заброньоване",
  occupied: "Зайняте",
};
export const initialPlots: Plot[] = Array.from({ length: 48 }, (_, i) => {
  const sector = Math.floor(i / 12);
  const row = Math.floor((i % 12) / 4);
  const col = i % 4;
  return {
    id: `90000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    number: `${["A", "B", "C", "D"][sector]}-${String((i % 12) + 1).padStart(2, "0")}`,
    sector: ["A", "B", "C", "D"][sector],
    x: 110 + (sector % 2) * 390 + col * 62,
    y: 100 + Math.floor(sector / 2) * 240 + row * 48,
    width: 46,
    height: 32,
    status: i % 7 === 0 ? "reserved" : i % 3 === 0 ? "occupied" : "free",
    area: i % 4 === 0 ? 6 : 4,
    price: 6500 + (i % 5) * 1200,
    description:
      i % 4 === 0
        ? "Сімейна ділянка біля зеленої алеї."
        : "Одиночна ділянка зі зручним доступом до пішохідної алеї.",
    positionX: Number((49.84 + Math.floor(i / 4) * 0.00005).toFixed(6)),
    positionY: Number((24.03 + (i % 4) * 0.00005).toFixed(6)),
  };
});
export function filterPlots(
  plots: Plot[],
  sector: string,
  status: string,
  query: string,
) {
  return plots.filter(
    (p) =>
      (!sector || p.sector === sector) &&
      (!status || p.status === status) &&
      p.number.toLowerCase().includes(query.trim().toLowerCase()),
  );
}
export function reserveDemoPlot(plots: Plot[], id: string): Plot[] {
  return plots.map((p) =>
    p.id === id && p.status === "free" ? { ...p, status: "reserved" } : p,
  );
}
