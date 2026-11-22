export const fmt = (v, d = 1) => Number(v).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 1) => `${fmt(v * 100, d)} %`;
export const tnd = v => {
  const a = Math.abs(v);
  if (a >= 1e6) return `TND ${fmt(v / 1e6, 2)} m`;
  if (a >= 1e3) return `TND ${fmt(v / 1e3, 1)} k`;
  return `TND ${fmt(v, 0)}`;
};
// sequential ramp for hazard scores on a dark surface: higher score = lighter and warmer
import { interpolateInferno } from 'd3-scale-chromatic';
export const ramp = t => interpolateInferno(0.2 + 0.75 * Math.max(0, Math.min(1, t)));
