import "../style.css";
import { PlotSelection } from './PlotSelection';
export function readPlotSelection(state: unknown): PlotSelection | null {
  if (!state || typeof state !== "object" || !("plotSelection" in state))
    return null;
  const p = state.plotSelection;
  if (!p || typeof p !== "object") return null;
  if (
    !("id" in p) ||
    typeof p.id !== "string" ||
    !("number" in p) ||
    typeof p.number !== "string" ||
    !("cemetery" in p) ||
    typeof p.cemetery !== "string" ||
    !("regionName" in p) ||
    typeof p.regionName !== "string" ||
    !("positionX" in p) ||
    typeof p.positionX !== "number" ||
    !Number.isFinite(p.positionX) ||
    !("positionY" in p) ||
    typeof p.positionY !== "number" ||
    !Number.isFinite(p.positionY)
  )
    return null;
  return {
    id: p.id,
    number: p.number,
    cemetery: p.cemetery,
    regionName: p.regionName,
    positionX: p.positionX,
    positionY: p.positionY,
  };
}