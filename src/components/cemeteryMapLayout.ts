import type { Cemetery } from "../new-api";

export const MAP_VIEW = { width: 720, height: 320 };
const BOUNDS = { west: 22.1, east: 40.2, south: 44.2, north: 52.4 };

export function mapPoint(longitude: number, latitude: number) {
  return {
    x: 160 + ((longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 400,
    y: 10 + ((BOUNDS.north - latitude) / (BOUNDS.north - BOUNDS.south)) * 280,
  };
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Підписи, які вже намальовані в ukraine-map.svg (країни, моря) — їх не перекриваємо.
const STATIC_LABELS: Box[] = [
  [331, 145, 409, 162], [417, 282, 495, 293], [448, 243, 546, 254],
  [56, 100, 106, 111], [333, 14, 391, 25], [610, 99, 646, 110],
  [198, 260, 256, 271], [97, 216, 149, 227],
].map(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2 }));

const MIN_PIN_DISTANCE = 12;
const CHAR_WIDTH = 5.9;
const LABEL_HEIGHT = 11;

export interface PinLayout {
  cemetery: Cemetery;
  /** Реальна позиція на карті. */
  x: number;
  y: number;
  /** Позиція маркера після розсування (щоб близькі точки не зливались). */
  px: number;
  py: number;
  moved: boolean;
}

export interface LabelLayout {
  key: string;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  /** Лінія-виноска від маркера до підпису, якщо підпис відсунуто. */
  leader?: { x1: number; y1: number; x2: number; y2: number };
}

function overlap(a: Box, b: Box) {
  const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  return w > 0 && h > 0 ? w * h : 0;
}

function spreadPins(cemeteries: Cemetery[]): PinLayout[] {
  const pins = cemeteries.map((cemetery) => {
    const { x, y } = mapPoint(cemetery.longitude, cemetery.latitude);
    return { cemetery, x, y, px: x, py: y, moved: false };
  });

  for (let step = 0; step < 60; step++) {
    let changed = false;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i];
        const b = pins[j];
        let dx = b.px - a.px;
        let dy = b.py - a.py;
        let dist = Math.hypot(dx, dy);
        if (dist >= MIN_PIN_DISTANCE) continue;
        if (dist < 0.01) {
          dx = 1;
          dy = 0;
          dist = 1;
        }
        const push = (MIN_PIN_DISTANCE - dist) / 2;
        a.px -= (dx / dist) * push;
        a.py -= (dy / dist) * push;
        b.px += (dx / dist) * push;
        b.py += (dy / dist) * push;
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const pin of pins) pin.moved = Math.hypot(pin.px - pin.x, pin.py - pin.y) > 0.5;
  return pins;
}

/**
 * Підпис — це місто (коротко), а якщо в місті кілька кладовищ — "Київ · 2".
 * Для вибраного кладовища показуємо повну назву. Повну назву кожного пина
 * видно в підказці (<title>) і через aria-label.
 */
export function layoutCemeteryMap(cemeteries: Cemetery[], selectedId: string) {
  const pins = spreadPins(cemeteries);

  const byCity = new Map<string, PinLayout[]>();
  for (const pin of pins) {
    const list = byCity.get(pin.cemetery.city) ?? [];
    list.push(pin);
    byCity.set(pin.cemetery.city, list);
  }

  const groups = [...byCity.entries()].map(([city, list]) => {
    const selected = list.find((pin) => pin.cemetery.id === selectedId);
    const cx = list.reduce((sum, pin) => sum + pin.px, 0) / list.length;
    const cy = list.reduce((sum, pin) => sum + pin.py, 0) / list.length;
    const text = selected
      ? `${selected.cemetery.name} · ${city}`
      : list.length > 1
        ? `${city} · ${list.length}`
        : city;
    return { key: city, text, cx, cy, list, selected: Boolean(selected) };
  });
  // Спершу вибране, потім найбільш «людні» місця.
  groups.sort((a, b) => Number(b.selected) - Number(a.selected) || b.list.length - a.list.length);

  const dotBoxes: Box[] = pins.map((pin) => ({
    x1: pin.px - 6, y1: pin.py - 6, x2: pin.px + 6, y2: pin.py + 6,
  }));
  const placed: Box[] = [...STATIC_LABELS];
  const labels: LabelLayout[] = [];

  for (const group of groups) {
    const width = group.text.length * CHAR_WIDTH + 4;
    const r = group.list.length > 1 ? 13 : 10;
    const candidates: {
      x: number;
      y: number;
      anchor: LabelLayout["anchor"];
      box: Box;
      ring: number;
    }[] = [];
    for (const ring of [0, 10, 22, 36]) {
      const d = r + ring;
      const spots: [number, number, LabelLayout["anchor"]][] = [
        [d, 3.5, "start"],
        [-d, 3.5, "end"],
        [d * 0.7, -d * 0.7, "start"],
        [d * 0.7, d * 0.7 + 8, "start"],
        [-d * 0.7, -d * 0.7, "end"],
        [-d * 0.7, d * 0.7 + 8, "end"],
        [0, -d, "middle"],
        [0, d + 9, "middle"],
      ];
      for (const [ox, oy, anchor] of spots) {
        const x = group.cx + ox;
        const y = group.cy + oy;
        const x1 = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
        candidates.push({ x, y, anchor, ring, box: { x1, y1: y - LABEL_HEIGHT + 2, x2: x1 + width, y2: y + 3 } });
      }
    }

    let best = candidates[0];
    let bestScore = Infinity;
    candidates.forEach((candidate, index) => {
      let score = index * 0.5 + candidate.ring * 12; // ближчі позиції краще
      for (const other of placed) score += overlap(candidate.box, other) * 4;
      for (const dot of dotBoxes) score += overlap(candidate.box, dot) * 3;
      const { x1, y1, x2, y2 } = candidate.box;
      if (x1 < 2) score += (2 - x1) * 200;
      if (x2 > MAP_VIEW.width - 2) score += (x2 - MAP_VIEW.width + 2) * 200;
      if (y1 < 2) score += (2 - y1) * 200;
      if (y2 > MAP_VIEW.height - 2) score += (y2 - MAP_VIEW.height + 2) * 200;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    });

    placed.push(best.box);
    const nearX = Math.min(Math.max(group.cx, best.box.x1), best.box.x2);
    const nearY = Math.min(Math.max(group.cy, best.box.y1), best.box.y2 - 2);
    const far = Math.hypot(nearX - group.cx, nearY - group.cy) > r + 6;
    labels.push({
      key: group.key,
      text: group.text,
      x: best.x,
      y: best.y,
      anchor: best.anchor,
      leader: far
        ? { x1: group.cx, y1: group.cy, x2: nearX, y2: nearY }
        : undefined,
    });
  }

  return { pins, labels };
}
