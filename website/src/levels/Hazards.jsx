import { motion } from 'motion/react';
import Level from '../components/Level.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import { HAZ } from '../lib/data.js';
import { fmt } from '../lib/format.js';
import { grow } from '../lib/motion.js';

const CARDS = [
  { k: 'heat', ind: 'Days per year above 35 °C (daily maximum)', src: 'NASA NEX-GDDP-CMIP6', raw: 'hot35', unit: 'd/yr', gov: 'hot35' },
  { k: 'drought', ind: 'Consecutive dry days + change in annual rainfall', src: 'NASA NEX-GDDP-CMIP6', raw: 'cdd', unit: 'dry days', gov: 'cdd' },
  { k: 'flood', ind: '100-year riverine and coastal inundation depth', src: 'WRI Aqueduct Floods v2', raw: 'flood_share', unit: '% of loans in a flood zone', gov: 'flood_share' },
  { k: 'fire', ind: 'Burnable land cover within 2 km × fire weather', src: 'ESA WorldCover 2021', raw: null, gov: 'fuel', unit: '' }
];

export default function Hazards({ data, onDive }) {
  const hm = Object.fromEntries(data.hazard_means.map(r => [r.period, r]));
  const t0 = hm.baseline, t5 = hm.ssp585_2050, t2 = hm.ssp245_2050;
  const govTop = key => data.gov_hazards.filter(r => r.period === 'ssp585_2050').sort((a, b) => b[key] - a[key]).slice(0, 3);
  return (
    <Level id="hazards" n={2} name="Hazards" title="Four hazards, measured at every loan"
      objective="Learn what each hazard measures and where it bites. Scores run from 0 (none) to 1 (severe), on fixed bounds."
      dives={[['heat', 'Heat'], ['drought', 'Drought'], ['flood', 'Flood'], ['fire', 'Wildfire']]} onDive={onDive}>
      <div className="hz-grid">
        {CARDS.map((c, i) => {
          const h = HAZ[c.k];
          const vals = [['Today', t0['s_' + c.k], '#9AA6BF'], ['SSP2-4.5 · 2050', t2['s_' + c.k], '#3987e5'], ['SSP5-8.5 · 2050', t5['s_' + c.k], '#e5484d']];
          return (
            <SpotlightCard key={c.k} className="panel hz" spotlightColor={h.hex + '33'} style={{ '--hz': h.hex }}>
              <div className="hz__head"><span className="hz__dot" /> <h3>{h.label}</h3>
                <button className="dive-btn" onClick={() => onDive(c.k)} aria-label={`Deep dive: ${h.label}`}>+ formula</button></div>
              <p className="hz__ind">{c.ind}</p>
              <p className="hz__src">{c.src}</p>
              <p className="card-kicker">Mean score across the book</p>
              <motion.ul className="hz__bars" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
                {vals.map(([l, v, col], j) => (
                  <li key={l}><span>{l}</span>
                    <span className="hz__track"><motion.span style={{ background: col }} variants={grow(v, 0.15 * j + 0.05 * i)} /></span>
                    <b>{fmt(v, 2)}</b></li>
                ))}
              </motion.ul>
              {c.raw && <p className="hz__raw"><b>{fmt(t0[c.raw], 1)}</b> → <b style={{ color: '#ff8a8d' }}>{fmt(t5[c.raw], 1)}</b> {c.unit} <span className="muted">today → SSP5-8.5 2050</span></p>}
              {c.k === 'fire' && <p className="hz__raw">Fuel is held at 2021 land cover; only fire weather changes.</p>}
              <p className="card-kicker">Hotspots in 2050 (SSP5-8.5)</p>
              <ol className="hz__top">{govTop(c.gov).map(r => <li key={r.governorate}>{r.governorate}</li>)}</ol>
            </SpotlightCard>
          );
        })}
      </div>
      <div className="panel strip">
        <div><small>Rainfall change by 2050</small><b>{fmt(t2.prchange, 1)} %</b><span className="muted">SSP2-4.5</span></div>
        <div><small>Rainfall change by 2050</small><b style={{ color: '#ff8a8d' }}>{fmt(t5.prchange, 1)} %</b><span className="muted">SSP5-8.5</span></div>
        <div><small>Hot days, book mean</small><b>{fmt(t0.hot35, 0)} → {fmt(t5.hot35, 0)}</b><span className="muted">days/yr above 35 °C</span></div>
        <div><small>Longest dry spell</small><b>{fmt(t0.cdd, 0)} → {fmt(t5.cdd, 0)}</b><span className="muted">days</span></div>
      </div>
    </Level>
  );
}
