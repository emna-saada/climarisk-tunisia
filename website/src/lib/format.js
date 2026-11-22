export const fmt = (v, d = 1) => Number(v).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 1) => `${fmt(v * 100, d)} %`;
export const tnd = v => {
  const a = Math.abs(v);
  if (a >= 1e6) return `TND ${fmt(v / 1e6, 2)} m`;
  if (a >= 1e3) return `TND ${fmt(v / 1e3, 1)} k`;
  return `TND ${fmt(v, 0)}`;
};
// sequential ramp for hazard scores on a dark surface: higher score = lighter and warmer
// slate -> ember -> amber -> sand: lightness rises monotonically, so "more hazard" reads as "brighter".
import { interpolateRgbBasis } from 'd3-interpolate';
const R = interpolateRgbBasis(['#1E3A40', '#5E3B32', '#A5503A', '#DE7F3A', '#F4BE6A', '#FBE3AE']);
export const ramp = t => R(0.04 + 0.96 * Math.max(0, Math.min(1, t)));
