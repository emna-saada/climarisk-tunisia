import { useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { Delaunay } from 'd3-delaunay';
import { interpolateRgb } from 'd3-interpolate';
import gsap from 'gsap';
import { reduced } from '../lib/motion.js';

// Tunisia map: governorate outlines (SVG, optional choropleth) + 2,000 loans drawn on a canvas.
// `colors` / `radii` are per-loan arrays; changes are tweened so a scenario switch reads as one motion.
export default function TunisiaMap({ geo, loans, colors, radii, fills, dim, tooltip, label, marker, className = '', onGovHover }) {
  const wrap = useRef(null), canvas = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 600 });
  const [tip, setTip] = useState(null);
  const state = useRef({ from: null, to: null, t: 1 });

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  const { proj, path } = useMemo(() => {
    const p = geoMercator().fitExtent([[12, 12], [size.w - 12, size.h - 12]], geo);
    return { proj: p, path: geoPath(p) };
  }, [geo, size]);
  const pts = useMemo(() => loans.map(l => proj([l.lon, l.lat])), [loans, proj]);
  const delaunay = useMemo(() => Delaunay.from(pts), [pts]);

  const draw = () => {
    const c = canvas.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== size.w * dpr) { c.width = size.w * dpr; c.height = size.h * dpr; }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    const { from, to, t } = state.current;
    for (let i = 0; i < pts.length; i++) {
      const col = from && t < 1 ? interpolateRgb(from[i], to[i])(t) : to[i];
      ctx.globalAlpha = dim && dim[i] ? 0.12 : 0.9;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pts[i][0], pts[i][1], radii ? radii[i] : 2.2, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    const s = state.current;
    const prevTo = s.to;
    s.from = prevTo && prevTo.length === colors.length ? prevTo : null;
    s.to = colors;
    if (!s.from || reduced()) { s.t = 1; draw(); return; }
    const o = { t: 0 };
    s.t = 0;
    const tw = gsap.to(o, { t: 1, duration: 0.7, ease: 'power2.out', onUpdate: () => { s.t = o.t; draw(); } });
    return () => tw.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { draw(); }, [size, pts, radii, dim]);

  const onMove = e => {
    if (!tooltip) return;
    const r = canvas.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const i = delaunay.find(x, y);
    const d = Math.hypot(pts[i][0] - x, pts[i][1] - y);
    setTip(d < 14 ? { i, x: pts[i][0], y: pts[i][1] } : null);
  };

  return (
    <div ref={wrap} className={`map ${className}`} onPointerMove={onMove} onPointerLeave={() => setTip(null)}>
      <svg width={size.w} height={size.h} aria-hidden="true">
        {geo.features.map(f => (
          <path key={f.properties.governorate} d={path(f)} className="map__gov"
            style={fills ? { fill: fills[f.properties.governorate] || 'var(--panel-2)' } : undefined}
            onPointerEnter={() => onGovHover && onGovHover(f.properties.governorate)}
            onPointerLeave={() => onGovHover && onGovHover(null)} />
        ))}
        {marker && (() => { const [x, y] = proj(marker); return (
          <g className="map__marker" transform={`translate(${x},${y})`}><circle r="16" className="pulse" /><circle r="6" /></g>); })()}
      </svg>
      <canvas ref={canvas} style={{ width: size.w, height: size.h }} role="img" aria-label={label} />
      {tip && (
        <div className="map__tip" style={{ left: tip.x, top: tip.y }}>{tooltip(tip.i)}</div>
      )}
    </div>
  );
}
