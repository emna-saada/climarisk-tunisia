import Aurora from '../bits/Aurora.jsx';
import SplitText from '../bits/SplitText.jsx';
import BlurText from '../bits/BlurText.jsx';
import CountUp from '../bits/CountUp.jsx';
import ShinyText from '../bits/ShinyText.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import { scrollToEl } from '../lib/motion.js';
import { fmt } from '../lib/format.js';

export default function Briefing({ data, onDive }) {
  const p = data.portfolio[0];
  const s = data.scenarios.find(r => r.period === 'ssp585_2050');
  const stats = [
    [p.n_loans, 'synthetic loans', 0, ','], [p.n_governorates, 'governorates', 0], [4, 'climate hazards', 0],
    [p.cmip6_models, 'CMIP6 models', 0], [p.total_ead_bn, 'TND bn book', 1]
  ];
  return (
    <section id="briefing" className="level briefing" data-level="0">
      <div className="briefing__aurora" aria-hidden="true">
        <Aurora lightMode colorStops={['#8FB0FF', '#FFD3D9', '#FF8796']} amplitude={1.0} blend={0.6} speed={0.5} height={0.5} glow={0.4} opacity={0.55} layers={2} />
      </div>
      <div className="briefing__grid">
        <div className="briefing__copy">
          <p className="eyebrow"><ShinyText text="Mission briefing · Tunisia · 2026" color="#94A3B8" shineColor="#D7263D" speed={3} /></p>
          <SplitText tag="h1" text="When the climate shifts, credit risk shifts with it." className="briefing__title"
            splitType="words" delay={60} duration={1} textAlign="left" trigger="load" />
          <BlurText className="briefing__lede" animateBy="words" delay={25} trigger="load"
            text="A bank lends to olive farms in Sfax, hotels in Sousse and factories in Gabès. Each loan sits on a piece of ground that is getting hotter and drier. Your mission: follow 2,000 loans through four hazards and three decades, and work out what it does to their risk." />
          <div className="briefing__cta">
            <button className="btn btn--primary" onClick={() => scrollToEl('#portfolio')}>Start the mission <span aria-hidden="true">↓</span></button>
            <button className="btn" onClick={() => onDive('index')}>Open the deep dives</button>
          </div>
        </div>
        <SpotlightCard theme="light" className="briefing__card" spotlightColor="rgba(215,38,61,0.10)" grain={0.04}>
          <p className="card-kicker">What you will uncover</p>
          <p className="briefing__big"><CountUp to={s.share_high_med} decimals={1} duration={2.2} delay={0.6} trigger="load" /><small>%</small></p>
          <p>of the loan book in a high-hazard zone by 2050 under SSP5-8.5, against {fmt(data.scenarios[0].share_high_med, 1)} % today.</p>
          <hr />
          <p className="card-kicker">How to play</p>
          <ol className="howto">
            <li><b>Scroll</b> to move through nine levels; the bar on top tracks your progress.</li>
            <li><b>Switch</b> scenario and horizon in the Time machine; every chart follows.</li>
            <li><b>Open a deep dive</b> (+) whenever you want the formula, the source or the assumption.</li>
          </ol>
          <p className="fineprint">100 % synthetic portfolio. Figures illustrate the method and describe no real bank.</p>
        </SpotlightCard>
      </div>
      <ul className="stats">
        {stats.map(([v, l, d, sep]) => (
          <li key={l}><b><CountUp to={v} decimals={d} separator={sep || ''} duration={1.6} trigger="load" /></b><span>{l}</span></li>
        ))}
      </ul>
    </section>
  );
}
