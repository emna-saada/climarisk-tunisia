import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Level from '../components/Level.jsx';
import TunisiaMap from '../components/TunisiaMap.jsx';
import Stepper, { Step } from '../bits/Stepper.jsx';
import { HAZ, HORIZONS, SCEN, periodKey } from '../lib/data.js';
import { credit, HKEYS } from '../lib/calc.js';
import { fmt, pct, tnd } from '../lib/format.js';
import { useTween } from '../lib/motion.js';

const Bar = ({ v, color, max = 1 }) => (
  <span className="mbar"><motion.span style={{ background: color }} animate={{ scaleX: Math.min(1, v / max) }} initial={false}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} /></span>
);

function Num({ v, f }) { const t = useTween(v, 0.45); return <>{f(t)}</>; }

export default function DoTheMath({ data, scenario, horizon, setScenario, setHorizon, onDive, toast }) {
  const L = data.loans_detail, asm = data.assumptions[0];
  const featured = useMemo(() => {
    const by = new Map();
    for (const l of L) if (!by.has(l.sector) || l.ead > by.get(l.sector).ead) by.set(l.sector, l);
    return [...by.values()];
  }, [L]);
  const [id, setId] = useState(() => (L.find(l => l.sector === 'Cereals') || L[0]).loan);
  const [mult, setMult] = useState(1);
  const [step, setStep] = useState(1);
  const loan = L.find(l => l.loan === id);
  const key = periodKey(scenario, horizon);
  const p = loan.periods[key], p0 = loan.periods.baseline;
  const r = credit(loan, p, asm, mult), r0 = credit(loan, p0, asm, mult);
  const b = asm.bounds;
  const dice = () => { const o = L.filter(l => l.loan !== id); setId(o[Math.floor(Math.random() * o.length)].loan); setStep(1); };

  const dimArr = useMemo(() => data.loans.map(() => true), [data.loans]);
  const grey = useMemo(() => data.loans.map(() => '#6F8F93'), [data.loans]);

  const scoreRows = [
    ['heat', `${fmt(p.hot35, 0)} days > 35 °C`, `${fmt(p.hot35, 0)} / ${b.heat_days_35.high}`],
    ['drought', `${fmt(p.cdd, 0)} dry days · rain ${p.prchange > 0 ? '+' : ''}${fmt(p.prchange, 0)} %`, `½·CDD score + ½·rain score`],
    ['flood', `${fmt(p.flood_depth_m, 2)} m at 100-yr`, `${fmt(p.flood_depth_m, 2)} / ${b.flood_depth_m.high}`],
    ['fire', `${fmt(100 * p.fuel, 0)} % burnable cover`, `fuel · (0.6 + 0.4·weather)`]
  ];

  return (
    <Level id="math" n={4} name="Do the math" title="Run the numbers on one loan"
      objective="Pick a loan, then walk through the five steps the pipeline runs for each of the 2,000. Change β to see how much the credit assumption matters."
      dives={[['composite', 'Composite score'], ['credit', 'PD, LGD and EL'], ['highhazard', 'High-hazard rule']]} onDive={onDive}>
      <div className="math">
        <div className="math__left">
          <div className="panel">
            <p className="card-kicker">Choose a loan</p>
            <div className="loan-chips">
              {featured.map(l => (
                <button key={l.loan} className={l.loan === id ? 'is-on' : ''} onClick={() => { setId(l.loan); setStep(1); }}>
                  <b>{l.sector}</b><small>{l.governorate}</small>
                </button>
              ))}
            </div>
            <div className="loan-pick">
              <select value={id} onChange={e => { setId(e.target.value); setStep(1); }} aria-label="All sample loans">
                {L.map(l => <option key={l.loan} value={l.loan}>{l.loan} · {l.sector} · {l.governorate}</option>)}
              </select>
              <button className="btn btn--small" onClick={dice} aria-label="Random loan">🎲 Random</button>
            </div>
          </div>
          <div className="panel loan-card">
            <div className="loan-card__map">
              <TunisiaMap geo={data.geo} loans={data.loans} colors={grey} dim={dimArr} marker={[loan.lon, loan.lat]} label="Location of the selected loan" />
            </div>
            <dl className="loan-card__facts">
              <div><dt>Loan</dt><dd>{loan.loan}</dd></div>
              <div><dt>Sector</dt><dd>{loan.sector}</dd></div>
              <div><dt>Governorate</dt><dd>{loan.governorate}</dd></div>
              <div><dt>Exposure (EAD)</dt><dd>{tnd(loan.ead)}</dd></div>
              <div><dt>Base PD</dt><dd>{pct(loan.pd, 2)}</dd></div>
              <div><dt>Base LGD</dt><dd>{pct(loan.lgd, 1)}</dd></div>
              <div><dt>Collateral</dt><dd>{loan.collateral.replace('_', ' ')}</dd></div>
            </dl>
          </div>
          <div className="panel">
            <p className="card-kicker">Scenario for this loan</p>
            <div className="mini-seg">
              {[0, 1, 2].map(h => <button key={h} className={horizon === h ? 'is-on' : ''} onClick={() => setHorizon(h)}>{HORIZONS[h]}</button>)}
              <span className="sep" />
              {Object.entries(SCEN).map(([k, s]) => <button key={k} className={scenario === k ? 'is-on' : ''} style={{ '--c': s.hex }} onClick={() => setScenario(k)}>{s.label}</button>)}
            </div>
            <label className="slider">
              <span>PD elasticity β × <b>{fmt(mult, 2)}</b> <small className="muted">(sector β = {fmt(r.beta / mult, 1)})</small></span>
              <input type="range" min="0.5" max="2" step="0.05" value={mult} onChange={e => { setMult(+e.target.value); toast('tuner', 'Model tuner', 'You stress-tested β.'); }} />
              <span className="slider__ticks"><i>0.5</i><i>1</i><i>1.5</i><i>2</i></span>
            </label>
          </div>
        </div>

        <div className="math__right">
          <Stepper step={step} onStepChange={setStep} width="100%" accentColor="#2FD1C0" indicator="numbers"
            backButtonText="Back" nextButtonText="Next step" completeButtonText="See the result"
            onFinalStepCompleted={() => { setStep(6); toast('analyst', 'Credit analyst', 'You computed a climate-adjusted expected loss.'); }}
            completedContent={
              <div className="calc-done">
                <p className="card-kicker">Result · {key === 'baseline' ? 'current climate' : `${SCEN[scenario].label} · ${HORIZONS[horizon]}`}</p>
                <p className="calc-done__big">+{tnd(r.add)}</p>
                <p>extra expected loss a year on this loan, {fmt(1e4 * r.add / loan.ead, 1)} bp of exposure ({tnd(r.add - r0.add)} more than in today's climate).</p>
                <button className="btn btn--small" onClick={() => setStep(1)}>Run it again</button>
              </div>}>
            <Step>
              <h4>1 · Read the climate at the loan</h4>
              <p className="muted">Median of five CMIP6 models at {fmt(loan.lat, 2)}° N, {fmt(loan.lon, 2)}° E.</p>
              <ul className="calc-list">
                <li><span>Days above 35 °C</span><b>{fmt(p.hot35, 0)}</b><small>today {fmt(p0.hot35, 0)}</small></li>
                <li><span>Longest dry spell</span><b>{fmt(p.cdd, 0)} d</b><small>today {fmt(p0.cdd, 0)} d</small></li>
                <li><span>Annual rainfall change</span><b>{p.prchange > 0 ? '+' : ''}{fmt(p.prchange, 1)} %</b><small>vs 2010–2014</small></li>
                <li><span>100-year flood depth</span><b>{fmt(p.flood_depth_m, 2)} m</b><small>Aqueduct</small></li>
                <li><span>Burnable land within 2 km</span><b>{fmt(100 * p.fuel, 0)} %</b><small>WorldCover</small></li>
              </ul>
            </Step>
            <Step>
              <h4>2 · Turn indicators into 0–1 scores</h4>
              <p className="muted">Linear between fixed physical bounds, clipped to [0, 1].</p>
              <ul className="calc-list calc-list--bars">
                {scoreRows.map(([h, raw, f]) => (
                  <li key={h}><span><i className="dot" style={{ background: HAZ[h].hex }} />{HAZ[h].short}<small>{raw}</small></span>
                    <Bar v={p[h]} color={HAZ[h].hex} /><b>{fmt(p[h], 2)}</b><small className="mono">{f}</small></li>
                ))}
              </ul>
            </Step>
            <Step>
              <h4>3 · Weight by what matters to a {loan.sector.toLowerCase()} loan</h4>
              <div className="formula">Score = Σ V·S / Σ V = ({HKEYS.map(h => `${fmt(r.V[h], 1)}×${fmt(p[h], 2)}`).join(' + ')}) / {fmt(HKEYS.reduce((s, h) => s + r.V[h], 0), 1)} = <b>{fmt(r.comp, 3)}</b></div>
              <ul className="calc-list calc-list--bars">
                {HKEYS.map(h => (
                  <li key={h}><span><i className="dot" style={{ background: HAZ[h].hex }} />{HAZ[h].short}<small>vulnerability V</small></span>
                    <Bar v={r.V[h]} color={HAZ[h].hex} /><b>{fmt(r.V[h], 1)}</b><small>{r.material.includes(h) ? 'material' : ''}</small></li>
                ))}
              </ul>
              <p className="calc-result">Composite score <b><Num v={r.comp} f={v => fmt(v, 3)} /></b> <span className="muted">today {fmt(r0.comp, 3)}</span></p>
            </Step>
            <Step>
              <h4>4 · Shift the probability of default and the loss given default</h4>
              <div className="formula">PD = {pct(loan.pd, 2)} × (1 + {fmt(r.beta, 2)} × {fmt(r.comp, 3)}) = <b>{pct(r.pd, 2)}</b></div>
              <div className="formula">LGD = {pct(loan.lgd, 1)} × (1 + {r.lgdSensitive ? `${asm.gamma} × ${fmt(p.flood, 2)}` : '0'}) = <b>{pct(r.lgd, 1)}</b>
                {!r.lgdSensitive && <small className="muted"> · {loan.collateral} collateral is not flood-adjusted</small>}</div>
              <div className="pd-viz">
                <div><small>Base PD</small><Bar v={loan.pd} max={Math.max(0.12, r.pd)} color="#9BB1B3" /><b>{pct(loan.pd, 2)}</b></div>
                <div><small>Climate PD</small><Bar v={r.pd} max={Math.max(0.12, r.pd)} color="#2FD1C0" /><b><Num v={r.pd} f={v => pct(v, 2)} /></b></div>
              </div>
            </Step>
            <Step>
              <h4>5 · Expected loss, and the high-hazard flag</h4>
              <div className="formula">EL = PD × LGD × EAD = {pct(r.pd, 2)} × {pct(r.lgd, 1)} × {tnd(loan.ead)} = <b>{tnd(r.el)}</b></div>
              <ul className="calc-list">
                <li><span>EL with base PD and LGD</span><b>{tnd(r.elBase)}</b></li>
                <li><span>Extra EL from climate</span><b className="accent"><Num v={r.add} f={tnd} /></b><small>{fmt(1e4 * r.add / loan.ead, 1)} bp</small></li>
                <li><span>High-hazard zone?</span>
                  <AnimatePresence mode="wait"><motion.b key={String(r.high)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={r.high ? 'flag flag--on' : 'flag'}>{r.high ? 'Yes' : 'No'}</motion.b></AnimatePresence>
                  <small>a material hazard ≥ {asm.threshold}</small></li>
              </ul>
            </Step>
          </Stepper>
          <div className="receipt panel">
            <span><small>Score</small><b>{fmt(r.comp, 3)}</b></span><i>→</i>
            <span><small>PD</small><b>{pct(r.pd, 2)}</b></span><i>→</i>
            <span><small>LGD</small><b>{pct(r.lgd, 1)}</b></span><i>→</i>
            <span><small>Extra EL</small><b className="accent">{tnd(r.add)}</b></span>
          </div>
          <p className="fineprint">Recomputed in your browser with the pipeline's formulas (src/climarisk/credit.py) from the median hazard scores, so the result can differ slightly from the pipeline's own median of per-model results.</p>
        </div>
      </div>
    </Level>
  );
}
