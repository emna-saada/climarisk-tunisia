export const fmt = (v, d = 1) => Number(v).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 1) => `${fmt(v * 100, d)} %`;
export const tnd = v => {
  const a = Math.abs(v);
  if (a >= 1e6) return `TND ${fmt(v / 1e6, 2)} m`;
  if (a >= 1e3) return `TND ${fmt(v / 1e3, 1)} k`;
  return `TND ${fmt(v, 0)}`;
};
// sequential ramp for hazard scores on a dark surface: higher score = lighter and warmer
// pale rose -> deep red on white: darker = more hazard (lightness falls monotonically).
import { interpolateRgbBasis } from 'd3-interpolate';
const R = interpolateRgbBasis(['#F7D9D4', '#F0A79A', '#E36A5C', '#C9333B', '#9B1B2B', '#5E0F1C']);
export const ramp = t => R(0.04 + 0.96 * Math.max(0, Math.min(1, t)));
