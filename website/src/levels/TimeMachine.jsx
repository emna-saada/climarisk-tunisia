import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Level from '../components/Level.jsx';
import TunisiaMap from '../components/TunisiaMap.jsx';
import { HORIZONS, SCEN, periodKey, periodIndex } from '../lib/data.js';
import { fmt, ramp } from '../lib/format.js';
import { scrollToY, useTween } from '../lib/motion.js';

function Band({ med, lo, hi, max, color, unit = '' }) {
  const p = v => `${Math.max(0, Math.min(100, (100 * v) / max))}%`;
  return (
    <div className="band" aria-label={`median ${fmt(med, 1)}${unit}, range ${fmt(lo, 1)} to ${fmt(hi, 1)}${unit}`}>
      <span className="band__range" style={{ left: p(lo), width: `calc(${p(hi)} - ${p(lo)})`, background: color }} />
      <span className="band__med" style={{ left: p(med) }} />
    </div>
  );
}

export default function TimeMachine({ data, scenario, setScenario, horizon, setHorizon, onDive, toast }) {
  const pinRef = useRef(null), st = useRef(null), last = useRef(-1);
  const key = periodKey(scenario, horizon);
  const pi = periodIndex(key);
  const row = data.scenarios.find(r => r.period === key);
  const sc = SCEN[scenario];
  const col = horizon === 0 ? '#9BB1B3' : sc.hex;

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 980px) and (prefers-reduced-motion: no-preference)', () => {
      st.current = ScrollTrigger.create({
        trigger: pinRef.current, start: 'top top+=60', end: '+=170%', pin: true, anticipatePin: 1,
        onUpdate: s => {
          const i = Math.min(2, Math.floor(s.progress * 3));
          if (i !== last.current) { last.current = i; setHorizon(i); }
        }
      });
      return () => { st.current = null; };
    });
    return () => mm.revert();
  }, [setHorizon]);

  const prevH = useRef(horizon);
  useEffect(() => {
    if (horizon === 2 && prevH.current !== 2) toast('traveller', 'Time traveller', 'You reached 2050.');
    prevH.current = horizon;
  }, [horizon, toast]);

  const go = i => {
    const s = st.current;
    if (s) scrollToY(s.start + (s.end - s.start) * (i / 3 + 1 / 6)); else setHorizon(i);
  };
  const loans = data.loans;
  const colors = useMemo(() => loans.map(l => ramp(l.c[pi] / 0.6)), [loans, pi]);
  const radii = useMemo(() => loans.map(l => (l.h[pi] ? 3.6 : 1.9)), [loans, pi]);

  const share = useTween(row.share_high_med), el = useTween(row.el_vs_today_m_med), hot = useTween(row.hot35_days),
    cdd = useTween(row.cdd_days), pr = useTween(row.prchange_pct), bp = useTween(row.el_add_bp_med);

  return (
    <Level id="timemachine" n={3} name="Time machine" title="Travel to 2030 and 2050"
      objective="Scroll to move through time, or pick a stop. Switch the scenario and watch the map heat up. Big dots are loans in a high-hazard zone."
      dives={[['scenarios', 'Scenarios and models'], ['highhazard', 'What “high hazard” means']]} onDive={onDive}>
      <div ref={pinRef} className="tm">
        <div className="panel panel--map tm__map">
          <TunisiaMap geo={data.geo} loans={loans} colors={colors} radii={radii} label={`Composite hazard score per loan, ${row.label}`}
            tooltip={i => <><b>{loans[i].sector}</b><span>{loans[i].gov} · score {fmt(loans[i].c[pi], 2)}{loans[i].h[pi] ? ' · high hazard' : ''}</span></>} />
          <div className="map-legend">
            <span className="ramp" style={{ background: `linear-gradient(90deg, ${[0, .25, .5, .75, 1].map(ramp).join(',')})` }} />
            <span className="muted">composite score 0 → 0.6+</span>
            <span><i className="big" /> high-hazard zone</span>
          </div>
          <div className="tm__year" aria-hidden="true" style={{ color: col }}>{horizon === 0 ? '2012' : HORIZONS[horizon]}</div>
        </div>
        <div className="tm__console panel">
          <p className="card-kicker">Scenario</p>
          <div className="seg" role="radiogroup" aria-label="Scenario">
            {Object.entries(SCEN).map(([k, s]) => (
              <button key={k} role="radio" aria-checked={scenario === k} className={scenario === k ? 'is-on' : ''}
                style={{ '--c': s.hex }} onClick={() => setScenario(k)}><i />{s.label}<small>{s.blurb}</small></button>
            ))}
          </div>
          <p className="card-kicker">Horizon</p>
          <div className="timeline" role="radiogroup" aria-label="Horizon">
            <span className="timeline__line"><span style={{ width: `${horizon * 50}%`, background: col }} /></span>
            {HORIZONS.map((h, i) => (
              <button key={h} role="radio" aria-checked={horizon === i} className={horizon >= i ? 'is-past' : ''}
                style={{ '--c': col }} onClick={() => go(i)}><i />{h === 'Today' ? 'Today' : h}</button>
            ))}
          </div>
          <div className="tm__kpis">
            <div className="kpi kpi--hero">
              <small>Share of the book in a high-hazard zone</small>
              <b style={{ color: col }}>{fmt(share, 1)} %</b>
              <Band med={row.share_high_med} lo={row.share_high_p10} hi={row.share_high_p90} max={50} color={col} unit=" %" />
              <span className="muted">bar: 10–90 % range across the five climate models</span>
            </div>
            <div className="kpi">
              <small>Extra expected loss vs today</small>
              <b>+TND {fmt(el, 2)} m</b>
              <span className="muted">{horizon === 0 ? 'reference point' : `range ${fmt(row.el_vs_today_m_p10, 1)}–${fmt(row.el_vs_today_m_p90, 1)} m`}</span>
            </div>
            <div className="kpi"><small>Climate EL uplift</small><b>{fmt(bp, 1)} bp</b><span className="muted">of exposure</span></div>
            <div className="kpi"><small>Days above 35 °C</small><b>{fmt(hot, 0)}</b><span className="muted">per year, book mean</span></div>
            <div className="kpi"><small>Longest dry spell</small><b>{fmt(cdd, 0)} d</b><span className="muted">rainfall {pr > 0 ? '+' : ''}{fmt(pr, 1)} %</span></div>
          </div>
          <p className="tm__hint"><span className="mouse" aria-hidden="true" /> keep scrolling to move forward in time</p>
        </div>
      </div>
    </Level>
  );
}
