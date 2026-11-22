import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Level from '../components/Level.jsx';
import TunisiaMap from '../components/TunisiaMap.jsx';
import AnimatedContent from '../bits/AnimatedContent.jsx';
import { fmt } from '../lib/format.js';
import { grow } from '../lib/motion.js';

const NEUTRAL = '#94A3B8', PICK = '#D7263D';

export default function Portfolio({ data, onDive, toast }) {
  const loans = data.loans;
  const [sel, setSel] = useState(null);
  const total = useMemo(() => loans.reduce((s, l) => s + l.ead_m, 0), [loans]);
  const sectors = useMemo(() => {
    const m = new Map();
    for (const l of loans) { const r = m.get(l.sector) || { n: 0, ead: 0 }; r.n++; r.ead += l.ead_m; m.set(l.sector, r); }
    return [...m.entries()].map(([s, r]) => ({ s, ...r })).sort((a, b) => b.ead - a.ead);
  }, [loans]);
  const govs = useMemo(() => {
    const m = new Map();
    for (const l of loans) if (!sel || l.sector === sel) m.set(l.gov, (m.get(l.gov) || 0) + l.ead_m);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [loans, sel]);
  const radii = useMemo(() => loans.map(l => 1.4 + Math.sqrt(l.ead_m) * 1.15), [loans]);
  const colors = useMemo(() => loans.map(l => (sel && l.sector === sel ? PICK : NEUTRAL)), [loans, sel]);
  const dim = useMemo(() => (sel ? loans.map(l => l.sector !== sel) : null), [loans, sel]);
  const pick = s => { setSel(x => (x === s ? null : s)); toast('explorer', 'Explorer', 'You filtered the book by sector.'); };
  const max = sectors[0].ead;
  const cur = sel ? sectors.find(x => x.s === sel) : { n: loans.length, ead: total };

  return (
    <Level id="portfolio" n={1} name="Portfolio" title="Meet the loan book: 2,000 loans on the map"
      objective="Find where the money sits. Pick a sector to light up its loans; dot size is the amount lent."
      dives={[['portfolio', 'How the book is generated']]} onDive={onDive}>
      <div className="grid-map">
        <div className="panel panel--map">
          <TunisiaMap geo={data.geo} loans={loans} colors={colors} radii={radii} dim={dim} label="Map of the 2,000 synthetic loans"
            tooltip={i => <><b>{loans[i].sector}</b><span>{loans[i].gov} · TND {fmt(loans[i].ead_m, 2)} m</span></>} />
          <div className="map-legend">
            <span><i style={{ background: NEUTRAL }} /> loan</span>
            {sel && <span><i style={{ background: PICK }} /> {sel}</span>}
            <span className="muted">size ∝ √ exposure</span>
          </div>
        </div>
        <div className="side">
          <div className="panel kpis3">
            <div><small>Loans</small><b>{fmt(cur.n, 0)}</b></div>
            <div><small>Exposure</small><b>TND {fmt(cur.ead / 1000, 2)} bn</b></div>
            <div><small>Share of book</small><b>{fmt(100 * cur.ead / total, 1)} %</b></div>
          </div>
          <div className="panel">
            <p className="card-kicker">Exposure by sector · click to filter</p>
            <motion.ul className="bars" role="listbox" aria-label="Sectors" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
              {sectors.map((r, i) => (
                <li key={r.s}>
                  <button role="option" aria-selected={sel === r.s} className={`bar-row ${sel === r.s ? 'is-on' : ''} ${sel && sel !== r.s ? 'is-off' : ''}`} onClick={() => pick(r.s)}>
                    <span className="bar-row__label">{r.s}</span>
                    <span className="bar-row__track">
                      <motion.span className="bar-row__fill" variants={grow(r.ead / max, i * 0.04)} />
                    </span>
                    <span className="bar-row__val">{fmt(100 * r.ead / total, 1)} %</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          </div>
          <AnimatedContent distance={30} duration={0.6} className="panel">
            <p className="card-kicker">Top governorates {sel ? `· ${sel}` : ''}</p>
            <ol className="rank">
              {govs.map(([g, v]) => <li key={g}><span>{g}</span><b>TND {fmt(v, 0)} m</b></li>)}
            </ol>
          </AnimatedContent>
        </div>
      </div>
    </Level>
  );
}
