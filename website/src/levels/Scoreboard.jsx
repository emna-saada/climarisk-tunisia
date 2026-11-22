import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Level from '../components/Level.jsx';
import TunisiaMap from '../components/TunisiaMap.jsx';
import CountUp from '../bits/CountUp.jsx';
import AnimatedContent from '../bits/AnimatedContent.jsx';
import { HAZ, HORIZONS, SCEN, periodKey } from '../lib/data.js';
import { fmt, ramp } from '../lib/format.js';
import { useTween } from '../lib/motion.js';

const EASE = [0.22, 1, 0.36, 1];
function T({ v, d = 1 }) { return <>{fmt(useTween(v, 0.5), d)}</>; }

export default function Scoreboard({ data, scenario, setScenario, horizon, setHorizon, onDive }) {
  const key = periodKey(scenario, horizon);
  const row = data.scenarios.find(r => r.period === key);
  const col = horizon === 0 ? '#94A3B8' : SCEN[scenario].hex;
  const [gov, setGov] = useState(null);

  const sectors = useMemo(() => data.sectors.filter(r => r.period === key).sort((a, b) => b.el_add_bp - a.el_add_bp), [data, key]);
  const govs = useMemo(() => data.governorates.filter(r => r.period === key).sort((a, b) => b.el_add_bp - a.el_add_bp), [data, key]);
  const fills = useMemo(() => Object.fromEntries(govs.map(g => [g.governorate, ramp(g.el_add_bp / 65)])), [govs]);
  const heat = useMemo(() => data.heatmap.filter(r => r.period === key), [data, key]);
  const hsec = [...new Set(heat.map(r => r.sector))];
  const cell = (s, h) => heat.find(r => r.sector === s && r.hazard === h)?.score ?? 0;
  const noLoans = useMemo(() => [], []);
  const g = gov && govs.find(x => x.governorate === gov);
  const maxBp = 90;

  return (
    <Level id="scoreboard" n={5} name="Scoreboard" title="The results, sector by sector and place by place"
      objective="Read the final score for any scenario. Hover a governorate; compare sectors. The bars move when you switch."
      dives={[['credit', 'How EL is computed'], ['scenarios', 'Median and model range']]} onDive={onDive}>
      <div className="sb-controls panel">
        <div className="mini-seg">
          {[0, 1, 2].map(h => <button key={h} className={horizon === h ? 'is-on' : ''} onClick={() => setHorizon(h)}>{HORIZONS[h]}</button>)}
          <span className="sep" />
          {Object.entries(SCEN).map(([k, s]) => <button key={k} className={scenario === k ? 'is-on' : ''} style={{ '--c': s.hex }} onClick={() => setScenario(k)}>{s.label}</button>)}
        </div>
        <span className="muted">Showing <b style={{ color: col }}>{row.label}</b> · medians of five climate models</span>
      </div>

      <div className="sb-kpis">
        {[
          ['Book in high-hazard zones', row.share_high_med, ' %', `range ${fmt(row.share_high_p10, 1)}–${fmt(row.share_high_p90, 1)} %`],
          ['Extra EL vs today', row.el_vs_today_m_med, ' m', horizon === 0 ? 'reference' : `range ${fmt(row.el_vs_today_m_p10, 1)}–${fmt(row.el_vs_today_m_p90, 1)} m`, 'TND '],
          ['Total climate EL uplift', row.el_add_m_med, ' m', `${fmt(row.el_add_bp_med, 1)} bp of exposure`, 'TND '],
          ['Base expected loss', data.portfolio[0].el_base_m, ' m', 'before any climate adjustment', 'TND ']
        ].map(([l, v, u, s, pre], i) => (
          <AnimatedContent key={l} className="panel kpi-tile" distance={24} delay={i * 0.06} duration={0.6}>
            <small>{l}</small>
            <b style={i < 3 ? { color: col } : undefined}>{pre}<T v={v} d={i === 0 ? 1 : 2} />{u}</b>
            <span className="muted">{s}</span>
          </AnimatedContent>
        ))}
      </div>

      <div className="sb-grid">
        <div className="panel sb-sectors">
          <p className="card-kicker">Extra expected loss by sector · bp of exposure</p>
          <ul className="hbars">
            {sectors.map(s => (
              <motion.li key={s.sector} layout transition={{ duration: 0.35, ease: EASE }}>
                <span className="hbars__label">{s.sector}</span>
                <span className="hbars__track">
                  <motion.span className="hbars__fill" style={{ background: col }} initial={{ scaleX: 0 }}
                    animate={{ scaleX: s.el_add_bp / maxBp }} transition={{ duration: 0.5, ease: EASE }} />
                </span>
                <b>{fmt(s.el_add_bp, 1)}</b>
                <small className="muted">{fmt(s.share_high, 0)} % high</small>
              </motion.li>
            ))}
          </ul>
          <p className="fineprint">"high": share of the sector's exposure in a high-hazard zone.</p>
        </div>

        <div className="panel sb-map">
          <p className="card-kicker">Extra EL by governorate · bp</p>
          <div className="sb-map__wrap">
            <TunisiaMap geo={data.geo} loans={noLoans} colors={noLoans} fills={fills} onGovHover={setGov} label="Choropleth of extra expected loss by governorate" />
            <AnimatePresence>
              {g && (
                <motion.div className="sb-map__tip" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <b>{g.governorate}</b><span>{fmt(g.el_add_bp, 1)} bp · range {fmt(g.el_add_bp_p10, 1)}–{fmt(g.el_add_bp_p90, 1)}</span>
                  <span>{fmt(g.share_high, 1)} % of exposure in high-hazard zones</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="map-legend"><span className="ramp" style={{ background: `linear-gradient(90deg, ${[0, .25, .5, .75, 1].map(ramp).join(',')})` }} /><span className="muted">0 → 65 bp</span></div>
          <ol className="rank rank--tight">
            {govs.slice(0, 5).map((r, i) => <li key={r.governorate}><span><i>{i + 1}</i>{r.governorate}</span><b>{fmt(r.el_add_bp, 1)} bp</b></li>)}
          </ol>
        </div>

        <div className="panel sb-heat">
          <p className="card-kicker">Hazard score by sector · exposure-weighted</p>
          <div className="heat" role="table" aria-label="Hazard score by sector and hazard">
            <div className="heat__row heat__row--head" role="row"><span />{Object.values(HAZ).map(h => <span key={h.short} role="columnheader" style={{ color: h.hex }}>{h.short}</span>)}</div>
            {hsec.map(s => (
              <div className="heat__row" role="row" key={s}>
                <span role="rowheader">{s}</span>
                {Object.keys(HAZ).map(h => {
                  const v = cell(s, h);
                  return <motion.span role="cell" key={h} animate={{ backgroundColor: ramp(v / 0.8) }} transition={{ duration: 0.5 }}
                    style={{ color: v > 0.45 ? '#FFFFFF' : '#0F172A' }}>{fmt(v, 2)}</motion.span>;
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="panel sb-top">
          <p className="card-kicker">Largest climate add-ons · SSP5-8.5 · 2050</p>
          <table className="tbl">
            <thead><tr><th>Loan</th><th>Sector</th><th>Governorate</th><th>EAD</th><th>Score</th><th>Extra EL</th></tr></thead>
            <tbody>
              {data.top_exposures.slice(0, 8).map(r => (
                <tr key={r.loan}><td className="mono">{r.loan}</td><td>{r.sector}</td><td>{r.governorate}</td>
                  <td>{fmt(r.ead_m, 1)} m</td><td><span className="pill" style={{ background: ramp(r.score / 0.6), color: r.score > 0.35 ? '#FFFFFF' : '#0F172A' }}>{fmt(r.score, 2)}</span></td>
                  <td><b>{fmt(r.el_add_k, 1)} k</b></td></tr>
              ))}
            </tbody>
          </table>
          <p className="fineprint">Synthetic identifiers. Amounts in TND.</p>
        </div>
      </div>
      <div className="sb-callout panel">
        <CountUp to={sectors[0]?.el_add_bp || 0} decimals={1} duration={1.2} /><span> bp</span>
        <p><b>{sectors[0]?.sector}</b> lead the extra loss in this scenario: rain-fed farms carry the highest drought vulnerability and the highest PD elasticity.</p>
      </div>
    </Level>
  );
}
