import { motion } from 'motion/react';
import Level from '../components/Level.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import ScrollReveal from '../bits/ScrollReveal.jsx';
import { fmt } from '../lib/format.js';
import { grow } from '../lib/motion.js';

const EASE = [0.22, 1, 0.36, 1];

export default function StressTest({ data, onDive }) {
  const sens = data.sensitivity;
  const base = sens.find(r => r.test === 'β × 1.0');
  const rows = sens.filter(r => r.test !== 'β × 1.0');
  const M = 100;
  const sc = data.scenarios.filter(r => r.period !== 'baseline');
  const maxEl = 6;
  return (
    <Level id="stress" n={6} name="Stress test" title="Break the model: which assumption matters most?"
      objective="Shake each assumption and see what moves. Then check the hazards against an independent open-source benchmark."
      dives={[['sensitivity', 'How the test is run'], ['physrisk', 'physrisk benchmark']]} onDive={onDive}>
      <div className="st-grid">
        <div className="panel st-tornado">
          <p className="card-kicker">Change in total extra EL · SSP5-8.5 · 2050 · base TND {fmt(base.el_add_m, 2)} m</p>
          <motion.ul className="tornado" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            {rows.map((r, i) => {
              const w = Math.abs(r.delta_pct) / M / 2;
              const neg = r.delta_pct < 0;
              const isBeta = r.test.startsWith('β');
              return (
                <li key={r.test} className={isBeta ? 'is-beta' : ''}>
                  <span className="tornado__label">{r.test}</span>
                  <span className="tornado__track">
                    <span className="tornado__axis" />
                    <motion.span className="tornado__bar" style={{ [neg ? 'right' : 'left']: '50%', background: isBeta ? '#F5B544' : '#8FA3C7', transformOrigin: neg ? 'right' : 'left', width: `${w * 100}%` }}
                      variants={grow(1, i * 0.05)} />
                  </span>
                  <b>{r.delta_pct > 0 ? '+' : ''}{fmt(r.delta_pct, 1)} %</b>
                </li>
              );
            })}
          </motion.ul>
          <p className="fineprint">Amber: PD elasticity β. Grey: ±25 % on one hazard's vulnerability weights. Axis ±100 %.</p>
        </div>

        <div className="panel st-models">
          <p className="card-kicker">Extra EL vs today · median and 10–90 % range across five models (TND m)</p>
          <motion.ul className="whisk" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            {sc.map((r, i) => {
              const c = r.scenario === 'SSP2-4.5' ? '#3987e5' : '#e5484d';
              const p = v => `${(100 * v) / maxEl}%`;
              return (
                <li key={r.period}>
                  <span className="whisk__label">{r.label}</span>
                  <span className="whisk__track">
                    <motion.span className="whisk__range" style={{ left: p(r.el_vs_today_m_p10), width: `calc(${p(r.el_vs_today_m_p90)} - ${p(r.el_vs_today_m_p10)})`, background: c }}
                      variants={{ hidden: { opacity: 0, scaleX: 0.2 }, show: { opacity: 0.45, scaleX: 1, transition: { duration: 0.6, delay: i * 0.08 } } }} />
                    <motion.span className="whisk__dot" style={{ left: p(r.el_vs_today_m_med), background: c }}
                      variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { type: 'spring', stiffness: 400, damping: 18, delay: 0.3 + i * 0.08 } } }} />
                  </span>
                  <b>{fmt(r.el_vs_today_m_med, 2)}</b>
                </li>
              );
            })}
          </motion.ul>
          <div className="whisk__axis"><i>0</i><i>2</i><i>4</i><i>6</i></div>
        </div>

        <div className="st-phys">
          {data.physrisk.map((r, i) => {
            const v = r.value;
            return (
              <SpotlightCard key={r.indicator} className="panel gauge" spotlightColor="rgba(143,163,199,0.18)">
                <p className="card-kicker">{r.indicator.replace(' — ', ' · ')}</p>
                <motion.div className="gauge__track" initial="hidden" whileInView="show" viewport={{ once: true }}><span className="gauge__zero" />
                  <motion.span className="gauge__bar" style={{ [v < 0 ? 'right' : 'left']: '50%', background: v < 0 ? '#c98500' : '#199e70', transformOrigin: v < 0 ? 'right' : 'left', width: `${Math.abs(v) * 50}%` }}
                    variants={grow(1, i * 0.1)} />
                </motion.div>
                <b>{v > 0 ? '+' : ''}{fmt(v, 2)}</b>
                <span className="muted">{v < 0 ? 'opposite ranking: SPEI flags the wetter north' : 'same places rank as hot'}</span>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
      <div className="panel lesson">
        <ScrollReveal baseOpacity={0.15} enableBlur blurStrength={4} containerClassName="lesson__text">
          Doubling β doubles the answer. Moving a hazard weight by a quarter barely moves it. The credit link, not the climate model, is what a bank should calibrate first.
        </ScrollReveal>
      </div>
    </Level>
  );
}
